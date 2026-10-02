import express from 'express';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  estimateAudience,
  launchCampaign,
} from '../controllers/campaignController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
} from '../validators/emailValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.CAMPAIGN_READ), getCampaigns);
router.get('/:id', requirePermission(PERMISSIONS.CAMPAIGN_READ), getCampaign);

router.post(
  '/',
  requirePermission(PERMISSIONS.CAMPAIGN_CREATE),
  validateRequest(createCampaignSchema),
  createCampaign
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CAMPAIGN_UPDATE),
  validateRequest(updateCampaignSchema),
  updateCampaign
);

router.delete('/:id', requirePermission(PERMISSIONS.CAMPAIGN_DELETE), deleteCampaign);

router.post('/estimate-audience', requirePermission(PERMISSIONS.CAMPAIGN_READ), estimateAudience);
router.post('/:id/launch', requirePermission(PERMISSIONS.CAMPAIGN_SEND), launchCampaign);

export default router;
