import express from 'express';
import {
  getDeals,
  getKanban,
  getForecast,
  getDeal,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} from '../controllers/dealController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import {
  createDealSchema,
  updateDealSchema,
  updateDealStageSchema,
} from '../validators/dealValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.DEAL_READ), getDeals);
router.get('/kanban', requirePermission(PERMISSIONS.DEAL_READ), getKanban);
router.get('/forecast', requirePermission(PERMISSIONS.DEAL_READ), getForecast);

router.get('/:id', requirePermission(PERMISSIONS.DEAL_READ), getDeal);

router.post(
  '/',
  requirePermission(PERMISSIONS.DEAL_CREATE),
  validateRequest(createDealSchema),
  createDeal
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.DEAL_UPDATE),
  validateRequest(updateDealSchema),
  updateDeal
);

router.patch(
  '/:id/stage',
  requirePermission(PERMISSIONS.DEAL_MOVE),
  validateRequest(updateDealStageSchema),
  updateDealStage
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.DEAL_DELETE),
  deleteDeal
);

export default router;
