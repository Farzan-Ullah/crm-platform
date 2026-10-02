import { Campaign } from '../models/Campaign.js';
import { EmailTemplate } from '../models/EmailTemplate.js';
import { Lead } from '../models/Lead.js';
import { Contact } from '../models/Contact.js';
import { sendDirectEmail } from './emailService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';

export const getCampaignsList = async ({
  tenantId,
  page = 1,
  limit = 20,
  status = '',
  search = '',
}) => {
  const query = { tenantId };

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { subject: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [campaigns, total] = await Promise.all([
    Campaign.find(query)
      .populate('templateId', 'name subject category')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Campaign.countDocuments(query),
  ]);

  return {
    campaigns,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const getCampaignById = async ({ tenantId, id }) => {
  const campaign = await Campaign.findOne({ _id: id, tenantId })
    .populate('templateId')
    .populate('createdBy', 'firstName lastName email');
  if (!campaign) throw new AppError('Campaign not found', 404);
  return campaign;
};

export const createNewCampaign = async ({
  tenantId,
  userId,
  name,
  subject,
  templateId,
  targetAudience = {},
  scheduledAt = null,
}) => {
  const template = await EmailTemplate.findOne({ _id: templateId, tenantId });
  if (!template) throw new AppError('Selected email template not found', 404);

  const campaign = await Campaign.create({
    tenantId,
    name: name.trim(),
    subject: subject ? subject.trim() : template.subject,
    templateId,
    targetAudience: {
      entityType: targetAudience.entityType || 'Lead',
      filters: targetAudience.filters || {},
    },
    status: scheduledAt ? 'Scheduled' : 'Draft',
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    createdBy: userId,
  });

  return campaign;
};

export const updateCampaignById = async ({ tenantId, id, data }) => {
  const campaign = await Campaign.findOne({ _id: id, tenantId });
  if (!campaign) throw new AppError('Campaign not found', 404);

  if (['Sending', 'Completed'].includes(campaign.status)) {
    throw new AppError('Cannot modify a campaign that is currently sending or already completed', 400);
  }

  Object.assign(campaign, data);
  await campaign.save();
  return campaign;
};

export const deleteCampaignById = async ({ tenantId, id }) => {
  const campaign = await Campaign.findOneAndDelete({ _id: id, tenantId });
  if (!campaign) throw new AppError('Campaign not found', 404);
  return { id: campaign._id, deleted: true };
};

/**
 * Builds the database filter query for audience selection
 */
const buildAudienceQuery = (tenantId, targetAudience = {}) => {
  const entityType = targetAudience.entityType || 'Lead';
  const filters = targetAudience.filters || {};
  const query = { tenantId };

  if (entityType === 'Lead') {
    query.isConverted = false;
    if (filters.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }
    if (filters.source && filters.source.length > 0) {
      query.source = { $in: filters.source };
    }
    if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
      query.score = {};
      if (filters.scoreMin !== undefined) query.score.$gte = Number(filters.scoreMin);
      if (filters.scoreMax !== undefined) query.score.$lte = Number(filters.scoreMax);
    }
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
  } else if (entityType === 'Contact') {
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
  }

  return { query, entityType };
};

/**
 * Preview matching audience count and sample list
 */
export const getEstimatedAudience = async ({ tenantId, targetAudience = {} }) => {
  const { query, entityType } = buildAudienceQuery(tenantId, targetAudience);

  let totalCount = 0;
  let samples = [];

  if (entityType === 'Lead') {
    totalCount = await Lead.countDocuments(query);
    samples = await Lead.find(query).limit(5).select('firstName lastName email company status');
  } else {
    totalCount = await Contact.countDocuments(query);
    samples = await Contact.find(query).limit(5).select('firstName lastName email jobTitle');
  }

  return {
    entityType,
    totalCount,
    samples,
  };
};

/**
 * Execute email campaign immediately (or via background scheduler)
 */
export const executeCampaign = async ({ tenantId, campaignId, userId }) => {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId }).populate('templateId');
  if (!campaign) throw new AppError('Campaign not found', 404);

  if (campaign.status === 'Sending' || campaign.status === 'Completed') {
    throw new AppError(`Campaign is already in '${campaign.status}' state`, 400);
  }

  const template = campaign.templateId;
  if (!template) throw new AppError('Campaign template missing', 400);

  const { query, entityType } = buildAudienceQuery(tenantId, campaign.targetAudience);

  // Fetch all recipients with valid emails
  let recipients = [];
  if (entityType === 'Lead') {
    recipients = await Lead.find({ ...query, email: { $exists: true, $ne: '' } });
  } else {
    recipients = await Contact.find({ ...query, email: { $exists: true, $ne: '' } });
  }

  if (recipients.length === 0) {
    throw new AppError('No matching recipients found with valid email addresses', 400);
  }

  campaign.status = 'Sending';
  campaign.startedAt = new Date();
  campaign.stats.totalRecipients = recipients.length;
  await campaign.save();

  logger.info(`Starting execution of campaign '${campaign.name}' with ${recipients.length} recipients`);

  // Process batch asynchronously
  (async () => {
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        await sendDirectEmail({
          tenantId,
          userId: userId || campaign.createdBy,
          to: recipient.email,
          subject: campaign.subject || template.subject,
          bodyHtml: template.bodyHtml,
          bodyText: template.bodyText,
          templateId: template._id,
          entityType,
          entityId: recipient._id,
          campaignId: campaign._id,
          variables: {
            firstName: recipient.firstName || '',
            lastName: recipient.lastName || '',
            company: recipient.company || '',
            jobTitle: recipient.jobTitle || '',
          },
        });
        sent++;
      } catch (err) {
        logger.error(`Campaign ${campaign._id} delivery error to ${recipient.email}: ${err.message}`);
        failed++;
      }

      // Update counters incrementally
      campaign.stats.sentCount = sent;
      campaign.stats.deliveredCount = sent;
      campaign.stats.failedCount = failed;
      await campaign.save();
    }

    campaign.status = 'Completed';
    campaign.completedAt = new Date();
    await campaign.save();
    logger.info(`Campaign '${campaign.name}' finished. Sent: ${sent}, Failed: ${failed}`);
  })().catch((err) => {
    logger.error(`Campaign execution background error: ${err.message}`);
  });

  return {
    campaignId: campaign._id,
    status: 'Sending',
    totalRecipients: recipients.length,
  };
};
