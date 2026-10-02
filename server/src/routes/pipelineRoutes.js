import express from 'express';
import {
  getPipelines,
  getPipeline,
  createPipeline,
  updatePipeline,
  deletePipeline,
} from '../controllers/pipelineController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import {
  createPipelineSchema,
  updatePipelineSchema,
} from '../validators/pipelineValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.DEAL_READ), getPipelines);
router.get('/:id', requirePermission(PERMISSIONS.DEAL_READ), getPipeline);

router.post(
  '/',
  requirePermission(PERMISSIONS.DEAL_CREATE),
  validateRequest(createPipelineSchema),
  createPipeline
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.DEAL_UPDATE),
  validateRequest(updatePipelineSchema),
  updatePipeline
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.DEAL_DELETE),
  deletePipeline
);

export default router;
