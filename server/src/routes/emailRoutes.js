import express from 'express';
import {
  sendEmail,
  getEmails,
  getEmailDetails,
  trackOpen,
  trackClick,
} from '../controllers/emailController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import { sendEmailSchema } from '../validators/emailValidators.js';

const router = express.Router();

// Public Tracking Endpoints (Must be unauthenticated so email clients can fetch)
router.get('/track/open/:trackingId', trackOpen);
router.get('/track/click/:trackingId', trackClick);

// Protected CRM Outbound Email Routes
router.use(requireAuth);

router.post(
  '/send',
  requirePermission(PERMISSIONS.EMAIL_SEND),
  validateRequest(sendEmailSchema),
  sendEmail
);

router.get('/', requirePermission(PERMISSIONS.EMAIL_READ), getEmails);
router.get('/:id', requirePermission(PERMISSIONS.EMAIL_READ), getEmailDetails);

export default router;
