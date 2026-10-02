import express from 'express';
import {
  getSummary,
  getFunnel,
  getForecast,
  getLeaderboard,
  getSources,
  getWinLoss,
  getActivities,
} from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router();

router.use(requireAuth);
router.use(requirePermission(PERMISSIONS.REPORT_VIEW));

router.get('/summary', getSummary);
router.get('/funnel', getFunnel);
router.get('/forecast', getForecast);
router.get('/leaderboard', getLeaderboard);
router.get('/sources', getSources);
router.get('/win-loss', getWinLoss);
router.get('/activities', getActivities);

export default router;
