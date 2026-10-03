import express from 'express';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All notification routes require authenticated session
router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationsCount);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
