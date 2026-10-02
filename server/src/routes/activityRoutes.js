import express from 'express';
import {
  getActivities,
  getCalendar,
  getUpcoming,
  getTimeline,
  getActivity,
  createActivity,
  updateActivity,
  toggleComplete,
  deleteActivity,
} from '../controllers/activityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import {
  createActivitySchema,
  updateActivitySchema,
} from '../validators/activityValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.ACTIVITY_READ), getActivities);
router.get('/calendar', requirePermission(PERMISSIONS.ACTIVITY_READ), getCalendar);
router.get('/upcoming', requirePermission(PERMISSIONS.ACTIVITY_READ), getUpcoming);
router.get('/timeline/:entityType/:entityId', requirePermission(PERMISSIONS.ACTIVITY_READ), getTimeline);

router.get('/:id', requirePermission(PERMISSIONS.ACTIVITY_READ), getActivity);

router.post(
  '/',
  requirePermission(PERMISSIONS.ACTIVITY_CREATE),
  validateRequest(createActivitySchema),
  createActivity
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.ACTIVITY_UPDATE),
  validateRequest(updateActivitySchema),
  updateActivity
);

router.patch(
  '/:id/complete',
  requirePermission(PERMISSIONS.ACTIVITY_UPDATE),
  toggleComplete
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.ACTIVITY_DELETE),
  deleteActivity
);

export default router;
