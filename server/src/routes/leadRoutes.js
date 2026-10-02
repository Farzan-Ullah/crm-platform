import express from 'express';
import {
  getLeads,
  createLead,
  getLead,
  updateLead,
  deleteLead,
  assignLead,
  bulkUpdateStatus,
  bulkAssign,
  bulkDelete,
  checkDuplicate,
} from '../controllers/leadController.js';
import { convertLead } from '../controllers/leadConversionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  bulkStatusSchema,
  bulkAssignSchema,
  bulkDeleteSchema,
} from '../validators/leadValidators.js';
import { convertLeadSchema } from '../validators/leadConversionValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.LEAD_READ), getLeads);
router.post('/', requirePermission(PERMISSIONS.LEAD_CREATE), validateRequest(createLeadSchema), createLead);
router.get('/duplicate-check', requirePermission(PERMISSIONS.LEAD_READ), checkDuplicate);

router.post('/bulk-status', requirePermission(PERMISSIONS.LEAD_UPDATE), validateRequest(bulkStatusSchema), bulkUpdateStatus);
router.post('/bulk-assign', requirePermission(PERMISSIONS.LEAD_ASSIGN), validateRequest(bulkAssignSchema), bulkAssign);
router.post('/bulk-delete', requirePermission(PERMISSIONS.LEAD_DELETE), validateRequest(bulkDeleteSchema), bulkDelete);

router.get('/:id', requirePermission(PERMISSIONS.LEAD_READ), getLead);
router.patch('/:id', requirePermission(PERMISSIONS.LEAD_UPDATE), validateRequest(updateLeadSchema), updateLead);
router.delete('/:id', requirePermission(PERMISSIONS.LEAD_DELETE), deleteLead);
router.post('/:id/assign', requirePermission(PERMISSIONS.LEAD_ASSIGN), validateRequest(assignLeadSchema), assignLead);
router.post('/:id/convert', requirePermission(PERMISSIONS.LEAD_UPDATE), validateRequest(convertLeadSchema), convertLead);

export default router;
