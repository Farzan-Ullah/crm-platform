import express from 'express';
import {
  login,
  refresh,
  logout,
  getMe,
  changePassword,
  updateProfile,
  getSessions,
  revokeSession,
  revokeOtherSessions,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { authLimiter } from '../middleware/rateLimiterMiddleware.js';
import {
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/authValidators.js';

const router = express.Router();

router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, validateRequest(updateProfileSchema), updateProfile);
router.post('/change-password', requireAuth, validateRequest(changePasswordSchema), changePassword);

// Active Session Management
router.get('/sessions', requireAuth, getSessions);
router.delete('/sessions/:id', requireAuth, revokeSession);
router.delete('/sessions', requireAuth, revokeOtherSessions);

export default router;
