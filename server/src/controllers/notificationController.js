import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
} from '../services/notificationService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { isRead, limit, page } = req.query;
    const result = await getUserNotifications({
      tenantId: req.tenantId,
      userId: req.user._id,
      isRead,
      limit: limit ? parseInt(limit, 10) : 20,
      page: page ? parseInt(page, 10) : 1,
    });

    return sendSuccess(res, 'Notifications retrieved successfully', {
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    }, 200, result.pagination);
  } catch (err) {
    return next(err);
  }
};

export const getUnreadNotificationsCount = async (req, res, next) => {
  try {
    const unreadCount = await getUnreadCount({
      tenantId: req.tenantId,
      userId: req.user._id,
    });

    return sendSuccess(res, 'Unread count retrieved', { unreadCount });
  } catch (err) {
    return next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await markNotificationAsRead({
      tenantId: req.tenantId,
      userId: req.user._id,
      notificationId: req.params.id,
    });

    return sendSuccess(res, 'Notification marked as read', notification);
  } catch (err) {
    return next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await markAllNotificationsAsRead({
      tenantId: req.tenantId,
      userId: req.user._id,
    });

    return sendSuccess(res, 'All notifications marked as read', result);
  } catch (err) {
    return next(err);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    await deleteNotificationById({
      tenantId: req.tenantId,
      userId: req.user._id,
      notificationId: req.params.id,
    });

    return sendSuccess(res, 'Notification deleted successfully');
  } catch (err) {
    return next(err);
  }
};
