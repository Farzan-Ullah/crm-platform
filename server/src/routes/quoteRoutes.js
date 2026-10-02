import express from 'express';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  approveQuotation,
  rejectQuotation,
  sendQuotation,
  acceptQuotation,
  declineQuotation,
  getQuotationStats,
  streamQuotationPdf,
} from '../controllers/quoteController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import {
  createQuoteSchema,
  updateQuoteSchema,
  rejectQuoteSchema,
  declineQuoteSchema,
} from '../validators/quoteValidators.js';

const router = express.Router();

router.use(requireAuth);

// Statistics
router.get(
  '/stats',
  requirePermission(PERMISSIONS.QUOTE_READ),
  getQuotationStats
);

// Listing & Search
router.get(
  '/',
  requirePermission(PERMISSIONS.QUOTE_READ),
  getQuotations
);

// Creation
router.post(
  '/',
  requirePermission(PERMISSIONS.QUOTE_CREATE),
  validateRequest(createQuoteSchema),
  createQuotation
);

// PDF Streaming
router.get(
  '/:id/pdf',
  requirePermission(PERMISSIONS.QUOTE_READ),
  streamQuotationPdf
);

// Single Details
router.get(
  '/:id',
  requirePermission(PERMISSIONS.QUOTE_READ),
  getQuotationById
);

// Update
router.put(
  '/:id',
  requirePermission(PERMISSIONS.QUOTE_UPDATE),
  validateRequest(updateQuoteSchema),
  updateQuotation
);

// Delete
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.QUOTE_DELETE),
  deleteQuotation
);

// Approvals & Lifecycle
router.post(
  '/:id/approve',
  requirePermission(PERMISSIONS.QUOTE_APPROVE),
  approveQuotation
);

router.post(
  '/:id/reject',
  requirePermission(PERMISSIONS.QUOTE_APPROVE),
  validateRequest(rejectQuoteSchema),
  rejectQuotation
);

router.post(
  '/:id/send',
  requirePermission(PERMISSIONS.QUOTE_SEND),
  sendQuotation
);

router.post(
  '/:id/accept',
  requirePermission(PERMISSIONS.QUOTE_UPDATE),
  acceptQuotation
);

router.post(
  '/:id/decline',
  requirePermission(PERMISSIONS.QUOTE_UPDATE),
  validateRequest(declineQuoteSchema),
  declineQuotation
);

export default router;
