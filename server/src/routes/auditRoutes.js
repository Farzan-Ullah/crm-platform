import { Router } from 'express';
import { getLogs, getStats, exportLogs } from '../controllers/auditController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = Router();

router.use(requireAuth);
router.use(requirePermission(PERMISSIONS.AUDIT_VIEW));

router.get('/', getLogs);
router.get('/stats', getStats);
router.get('/export', exportLogs);

export const auditRoutes = router;
