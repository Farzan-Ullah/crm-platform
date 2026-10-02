import express from 'express';
import {
  login,
  refresh,
  logout,
  getMe,
  changePassword,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { authLimiter } from '../middleware/rateLimiterMiddleware.js';
import {
  loginSchema,
  changePasswordSchema,
} from '../validators/authValidators.js';

const router = express.Router();

router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, validateRequest(changePasswordSchema), changePassword);

export default router;
