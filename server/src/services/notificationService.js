import { Notification } from '../models/Notification.js';
import { Deal } from '../models/Deal.js';
import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { AppError } from '../utils/AppError.js';

/**
 * Creates a new notification for a specific user within a tenant
 */
export const createNotification = async ({
  tenantId,
  userId,
  title,
  message,
  type = 'system',
  link = null,
  metadata = {},
}) => {
  if (!tenantId || !userId || !title || !message) {
    return null;
  }

  return Notification.create({
    tenantId,
    userId,
    title,
    message,
    type,
    link,
    metadata,
  });
};

/**
 * Ensures contextual seed notifications exist if a user currently has none
 */
export const ensureInitialNotifications = async ({ tenantId, userId }) => {
  const existingCount = await Notification.countDocuments({ tenantId, userId });
  if (existingCount > 0) return;

  const notificationsToCreate = [];

  // 1. Check for recent high-value deal
  const topDeal = await Deal.findOne({ tenantId }).sort({ value: -1 }).lean();
  if (topDeal) {
    notificationsToCreate.push({
      tenantId,
      userId,
      title: 'High-Value Opportunity Active',
      message: `Deal "${topDeal.title}" ($${(topDeal.value || 0).toLocaleString()}) is currently in progress.`,
      type: 'deal',
      link: `/deals/${topDeal._id}`,
      isRead: false,
    });
  }

  // 2. Check for recent hot lead
  const hotLead = await Lead.findOne({ tenantId, score: { $gte: 75 } }).sort({ score: -1 }).lean();
  if (hotLead) {
    notificationsToCreate.push({
      tenantId,
      userId,
      title: 'Hot Lead Ingested',
      message: `${hotLead.firstName} ${hotLead.lastName} from ${hotLead.company || 'Enterprise'} scored ${hotLead.score}/100.`,
      type: 'lead',
      link: `/leads/${hotLead._id}`,
      isRead: false,
    });
  }

  // 3. Check for pending activity
  const pendingTask = await Activity.findOne({ tenantId, status: 'Pending' }).sort({ dueDate: 1 }).lean();
  if (pendingTask) {
    notificationsToCreate.push({
      tenantId,
      userId,
      title: 'Action Item Scheduled',
      message: `Upcoming ${pendingTask.type}: "${pendingTask.title}" requires follow-up.`,
      type: 'activity',
      link: '/activities',
      isRead: false,
    });
  }

  // 4. Default welcome notification
  notificationsToCreate.push({
    tenantId,
    userId,
    title: 'Welcome to NexusCRM',
    message: 'Your multi-tenant workspace is fully operational. Track deals, manage leads, and stream proposals.',
    type: 'system',
    link: '/dashboard',
    isRead: true,
  });

  if (notificationsToCreate.length > 0) {
    await Notification.insertMany(notificationsToCreate);
  }
};

/**
 * Retrieves paginated notifications and unread count for current user
 */
export const getUserNotifications = async ({
  tenantId,
  userId,
  isRead,
  limit = 20,
  page = 1,
}) => {
  // Ensure user has initial notifications populated if empty
  await ensureInitialNotifications({ tenantId, userId });

  const query = { tenantId, userId };
  if (typeof isRead === 'boolean') {
    query.isRead = isRead;
  } else if (isRead === 'true' || isRead === 'false') {
    query.isRead = isRead === 'true';
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ tenantId, userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Returns just the unread count for badge display
 */
export const getUnreadCount = async ({ tenantId, userId }) => {
  return Notification.countDocuments({ tenantId, userId, isRead: false });
};

/**
 * Marks a specific notification as read
 */
export const markNotificationAsRead = async ({ tenantId, userId, notificationId }) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, tenantId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }

  return notification;
};

/**
 * Marks all notifications for a user as read
 */
export const markAllNotificationsAsRead = async ({ tenantId, userId }) => {
  await Notification.updateMany(
    { tenantId, userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return { success: true, message: 'All notifications marked as read' };
};

/**
 * Deletes a notification
 */
export const deleteNotificationById = async ({ tenantId, userId, notificationId }) => {
  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    tenantId,
    userId,
  });

  if (!result) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }

  return { success: true };
};
