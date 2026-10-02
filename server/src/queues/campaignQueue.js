import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { ENV } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Campaign } from '../models/Campaign.js';
import { executeCampaign } from '../services/campaignService.js';

let campaignQueue = null;
let campaignWorker = null;
let fallbackInterval = null;
let isRedisAvailable = false;
let redisClient = null;

export const checkScheduledCampaigns = async () => {
  try {
    const now = new Date();
    const dueCampaigns = await Campaign.find({
      status: 'Scheduled',
      scheduledAt: { $lte: now },
    });

    for (const campaign of dueCampaigns) {
      logger.info(`Scheduled Campaign triggering: ${campaign.name} (${campaign._id})`);
      try {
        await executeCampaign({
          tenantId: campaign.tenantId,
          campaignId: campaign._id,
          userId: campaign.createdBy,
        });
      } catch (err) {
        logger.error(`Failed to execute due campaign ${campaign._id}: ${err.message}`);
        campaign.status = 'Failed';
        await campaign.save();
      }
    }
  } catch (err) {
    logger.error(`Error in scheduled campaign poller: ${err.message}`);
  }
};

const startFallbackScheduler = () => {
  if (fallbackInterval) return;
  logger.info('In-memory MongoDB scheduled campaign poller started.');
  fallbackInterval = setInterval(checkScheduledCampaigns, 60 * 1000);
  if (fallbackInterval.unref) fallbackInterval.unref();
};

export const initCampaignService = async () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

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

  try {
    const opts = getRedisOptions();
    redisClient = typeof opts === 'string' ? new Redis(opts, { maxRetriesPerRequest: null }) : new Redis(opts);

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info('Redis connected for Campaign BullMQ Queue.');
      setupBullMQ();
    });

    redisClient.on('error', () => {
      isRedisAvailable = false;
      startFallbackScheduler();
    });
  } catch (err) {
    startFallbackScheduler();
  }
};

const setupBullMQ = () => {
  try {
    const connection = ENV.REDIS_URL
      ? ENV.REDIS_URL
      : {
          host: ENV.REDIS_HOST,
          port: ENV.REDIS_PORT,
          password: ENV.REDIS_PASSWORD || undefined,
          tls: (ENV.REDIS_HOST && ENV.REDIS_HOST.includes('upstash.io')) || process.env.REDIS_TLS === 'true' ? {} : undefined,
          maxRetriesPerRequest: null,
        };

    campaignQueue = new Queue('crm-campaigns', { connection });

    campaignWorker = new Worker(
      'crm-campaigns',
      async (job) => {
        const { tenantId, campaignId, userId } = job.data;
        logger.info(`BullMQ Worker executing campaign: ${campaignId}`);
        await executeCampaign({ tenantId, campaignId, userId });
      },
      { connection }
    );

    campaignWorker.on('completed', (job) => {
      logger.info(`Campaign job completed for campaign ${job.data?.campaignId}`);
    });

    campaignWorker.on('failed', (job, err) => {
      logger.error(`Campaign job failed for ${job?.data?.campaignId}: ${err.message}`);
    });
  } catch (err) {
    startFallbackScheduler();
  }
};

export const scheduleCampaignJob = async ({ tenantId, campaignId, scheduledAt, userId }) => {
  if (isRedisAvailable && campaignQueue) {
    try {
      const delayMs = Math.max(0, new Date(scheduledAt).getTime() - Date.now());
      await campaignQueue.add(
        'execute-campaign',
        {
          tenantId: tenantId.toString(),
          campaignId: campaignId.toString(),
          userId: userId.toString(),
        },
        {
          delay: delayMs,
          removeOnComplete: true,
          removeOnFail: 100,
        }
      );
    } catch (err) {
      logger.warn(`Failed to schedule BullMQ campaign job: ${err.message}`);
    }
  }
};
