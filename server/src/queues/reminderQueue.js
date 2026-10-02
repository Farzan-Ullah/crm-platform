import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { ENV } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Activity } from '../models/Activity.js';
import { User } from '../models/User.js';

let reminderQueue = null;
let reminderWorker = null;
let redisClient = null;
let isRedisAvailable = false;
let fallbackInterval = null;

const getRedisOptions = () => {
  if (ENV.REDIS_URL) {
    return ENV.REDIS_URL;
  }
  return {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    password: ENV.REDIS_PASSWORD || undefined,
    tls: (ENV.REDIS_HOST && ENV.REDIS_HOST.includes('upstash.io')) || process.env.REDIS_TLS === 'true' ? {} : undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy: () => null,
  };
};

// Initialize Redis & BullMQ or start Mongo interval poller fallback
export const initReminderService = async () => {
  try {
    const opts = getRedisOptions();
    redisClient = typeof opts === 'string' ? new Redis(opts, { maxRetriesPerRequest: null }) : new Redis(opts);

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info('Connected to Redis - BullMQ reminder queue active.');
      setupBullMQ();
    });

    redisClient.on('error', (err) => {
      if (isRedisAvailable) {
        logger.warn(`Redis disconnected: ${err.message}. Switching to fallback timer.`);
      }
      isRedisAvailable = false;
      startFallbackScheduler();
    });
  } catch (err) {
    logger.warn(`Redis connection failed: ${err.message}. Running fallback scheduler.`);
    startFallbackScheduler();
  }
};

const setupBullMQ = () => {
  try {
    const connection = getRedisOptions();

    reminderQueue = new Queue('crm-reminders', { connection });

    reminderWorker = new Worker(
      'crm-reminders',
      async (job) => {
        const { activityId, tenantId } = job.data;
        await processReminder(activityId, tenantId);
      },
      { connection }
    );

    reminderWorker.on('completed', (job) => {
      logger.info(`Reminder job completed for activity ${job.data?.activityId}`);
    });

    reminderWorker.on('failed', (job, err) => {
      logger.error(`Reminder job failed for activity ${job?.data?.activityId}: ${err.message}`);
    });
  } catch (err) {
    logger.warn(`BullMQ initialization error: ${err.message}. Using fallback scheduler.`);
    startFallbackScheduler();
  }
};

// Fallback interval scheduler when Redis is not available
const startFallbackScheduler = () => {
  if (fallbackInterval) return;

  logger.info('In-memory MongoDB reminder scheduler started (checking every 60s).');
  fallbackInterval = setInterval(async () => {
    try {
      const now = new Date();
      const dueActivities = await Activity.find({
        reminderEnabled: true,
        reminderSent: false,
        reminderTime: { $lte: now },
        status: 'Pending',
      }).limit(50);

      for (const act of dueActivities) {
        await processReminder(act._id, act.tenantId);
      }
    } catch (err) {
      logger.error(`Reminder fallback polling error: ${err.message}`);
    }
  }, 60000);
};

// Process and dispatch a due reminder
export const processReminder = async (activityId, tenantId) => {
  try {
    const activity = await Activity.findOne({ _id: activityId, tenantId })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!activity || activity.status !== 'Pending' || activity.reminderSent) {
      return;
    }

    // Mark reminder as dispatched
    activity.reminderSent = true;
    await activity.save();

    logger.info(
      `[REMINDER DISPATCHED] Activity '${activity.title}' (${activity.type}) due at ${activity.dueDate} for ${activity.assignedTo?.email}`
    );

    // In Phase 6 this can additionally invoke the outbound email sender
  } catch (err) {
    logger.error(`Failed to dispatch reminder for ${activityId}: ${err.message}`);
  }
};

// Schedule reminder for an activity
export const scheduleActivityReminder = async (activity) => {
  if (!activity.reminderEnabled || !activity.reminderTime) return null;

  const now = new Date();
  const delayMs = new Date(activity.reminderTime).getTime() - now.getTime();

  // If already in the past, process immediately
  if (delayMs <= 0) {
    await processReminder(activity._id, activity.tenantId);
    return null;
  }

  // If Redis & BullMQ are available, schedule delayed job
  if (isRedisAvailable && reminderQueue) {
    try {
      const job = await reminderQueue.add(
        'send-reminder',
        {
          activityId: activity._id.toString(),
          tenantId: activity.tenantId.toString(),
        },
        {
          delay: delayMs,
          removeOnComplete: true,
          removeOnFail: 100,
        }
      );
      activity.reminderJobId = job.id;
      await activity.save();
      return job.id;
    } catch (err) {
      logger.warn(`Failed to schedule BullMQ job: ${err.message}`);
    }
  }

  // Otherwise, the fallback poller will pick it up when reminderTime <= now
  return null;
};

// Cancel an existing reminder job
export const cancelActivityReminder = async (activityId, reminderJobId) => {
  if (reminderJobId && isRedisAvailable && reminderQueue) {
    try {
      const job = await reminderQueue.getJob(reminderJobId);
      if (job) await job.remove();
    } catch (err) {
      logger.warn(`Could not remove reminder job ${reminderJobId}: ${err.message}`);
    }
  }
};
