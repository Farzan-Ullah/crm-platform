import {
  getCampaignsList,
  getCampaignById,
  createNewCampaign,
  updateCampaignById,
  deleteCampaignById,
  getEstimatedAudience,
  executeCampaign,
} from '../services/campaignService.js';
import { scheduleCampaignJob } from '../queues/campaignQueue.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getCampaigns = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await getCampaignsList({
      tenantId: req.tenantId,
      page,
      limit,
      status,
      search,
    });
    return sendSuccess(res, 'Campaigns fetched', result.campaigns, 200, result.pagination);
  } catch (err) {
    return next(err);
  }
};

export const getCampaign = async (req, res, next) => {
  try {
    const campaign = await getCampaignById({
      tenantId: req.tenantId,
      id: req.params.id,
    });
    return sendSuccess(res, 'Campaign details fetched', campaign);
  } catch (err) {
    return next(err);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const { name, subject, templateId, targetAudience, scheduledAt } = req.body;
    const campaign = await createNewCampaign({
      tenantId: req.tenantId,
      userId: req.user._id,
      name,
      subject,
      templateId,
      targetAudience,
      scheduledAt,
    });

    // If scheduled for future, register in queue
    if (scheduledAt) {
      await scheduleCampaignJob({
        tenantId: req.tenantId,
        campaignId: campaign._id,
        scheduledAt,
        userId: req.user._id,
      });
    }

    return sendSuccess(res, 'Campaign created successfully', campaign, 201);
  } catch (err) {
    return next(err);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const campaign = await updateCampaignById({
      tenantId: req.tenantId,
      id: req.params.id,
      data: req.body,
    });
    return sendSuccess(res, 'Campaign updated successfully', campaign);
  } catch (err) {
    return next(err);
  }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const result = await deleteCampaignById({
      tenantId: req.tenantId,
      id: req.params.id,
    });
    return sendSuccess(res, 'Campaign deleted successfully', result);
  } catch (err) {
    return next(err);
  }
};

export const estimateAudience = async (req, res, next) => {
  try {
    const audienceEstimate = await getEstimatedAudience({
      tenantId: req.tenantId,
      targetAudience: req.body.targetAudience,
    });
    return sendSuccess(res, 'Audience estimate calculated', audienceEstimate);
  } catch (err) {
    return next(err);
  }
};

export const launchCampaign = async (req, res, next) => {
  try {
    const execution = await executeCampaign({
      tenantId: req.tenantId,
      campaignId: req.params.id,
      userId: req.user._id,
    });
    return sendSuccess(res, 'Campaign launched successfully', execution);
  } catch (err) {
    return next(err);
  }
};
