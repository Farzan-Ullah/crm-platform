import { Router } from 'express';
import { getSettings, updateSettings, testSmtp } from '../controllers/tenantController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = Router();

router.use(requireAuth);

router.get('/settings', getSettings);
router.patch('/settings', requirePermission(PERMISSIONS.SETTINGS_MANAGE), updateSettings);
router.post('/settings/test-smtp', requirePermission(PERMISSIONS.SETTINGS_MANAGE), testSmtp);

export const tenantRoutes = router;
