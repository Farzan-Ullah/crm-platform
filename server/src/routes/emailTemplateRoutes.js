import express from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplateContent,
} from '../controllers/emailTemplateController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
} from '../validators/emailValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.TEMPLATE_READ), getTemplates);
router.get('/:id', requirePermission(PERMISSIONS.TEMPLATE_READ), getTemplate);

router.post(
  '/',
  requirePermission(PERMISSIONS.TEMPLATE_CREATE),
  validateRequest(createTemplateSchema),
  createTemplate
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.TEMPLATE_UPDATE),
  validateRequest(updateTemplateSchema),
  updateTemplate
);

router.delete('/:id', requirePermission(PERMISSIONS.TEMPLATE_DELETE), deleteTemplate);

router.post('/:templateId/preview', requirePermission(PERMISSIONS.TEMPLATE_READ), previewTemplateContent);

export default router;
