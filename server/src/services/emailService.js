import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { EmailLog } from '../models/EmailLog.js';
import { EmailTemplate } from '../models/EmailTemplate.js';
import { Campaign } from '../models/Campaign.js';
import { Activity } from '../models/Activity.js';
import { Lead } from '../models/Lead.js';
import { Contact } from '../models/Contact.js';
import { Company } from '../models/Company.js';
import { Deal } from '../models/Deal.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';

// 1x1 Transparent GIF Buffer for tracking pixel
export const TRACKING_PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// Create transporter: uses SMTP if configured, else jsonTransport
const createTransporter = () => {
  const isTest = process.env.NODE_ENV === 'test';
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const isPlaceholder = !process.env.SMTP_HOST || process.env.SMTP_USER === 'test_user' || !smtpPass;

  if (!isTest && !isPlaceholder) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPass,
      },
    });
  }

  // Safe developer / testing JSON transport (no external socket or live credentials required)
  return nodemailer.createTransport({
    jsonTransport: true,
  });
};

const transporter = createTransporter();

/**
 * Interpolate mustache-style {{variable}} tags with data object
 */
export const interpolateVariables = (templateText, data = {}) => {
  if (!templateText) return '';
  return templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
  });
};

/**
 * Injects 1x1 invisible open tracking pixel into HTML
 */
export const injectTrackingPixel = (html, trackingId, baseUrl) => {
  if (!html || !trackingId) return html;
  const pixelUrl = `${baseUrl}/api/v1/emails/track/open/${trackingId}`;
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none !important; width:1px !important; height:1px !important; border:0 !important;" />`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixelTag}</body>`);
  }
  return `${html}${pixelTag}`;
};

/**
 * Rewrites <a href="..."> links to route through click tracker
 */
export const wrapClickLinks = (html, trackingId, baseUrl) => {
  if (!html || !trackingId) return html;
  const trackerBase = `${baseUrl}/api/v1/emails/track/click/${trackingId}`;

  // Match href="http..." or href='http...'
  return html.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(https?:\/\/[^"']+)\1/gi, (match, quote, targetUrl) => {
    // Avoid double-wrapping tracking URLs
    if (targetUrl.includes('/api/v1/emails/track/')) {
      return match;
    }
    const encodedTarget = encodeURIComponent(targetUrl);
    const trackingUrl = `${trackerBase}?target=${encodedTarget}`;
    return match.replace(targetUrl, trackingUrl);
  });
};

/**
 * Send a direct single email with variable interpolation & tracking
 */
export const sendDirectEmail = async ({
  tenantId,
  userId,
  to,
  from,
  cc = [],
  bcc = [],
  subject,
  bodyHtml,
  bodyText = '',
  templateId = null,
  entityType = null,
  entityId = null,
  variables = {},
  campaignId = null,
  baseUrl = process.env.APP_URL || 'http://localhost:5000',
}) => {
  if (!to) {
    throw new AppError('Recipient email address is required', 400);
  }

  // If templateId provided, load template if body is not supplied
  if (templateId && !bodyHtml) {
    const template = await EmailTemplate.findOne({ _id: templateId, tenantId });
    if (!template) throw new AppError('Email template not found', 404);
    bodyHtml = template.bodyHtml;
    subject = subject || template.subject;
    bodyText = bodyText || template.bodyText;
  }

  if (!subject) throw new AppError('Subject is required', 400);
  if (!bodyHtml) throw new AppError('Email body content is required', 400);

  // Auto-fill variables from entity if available
  const mergedVariables = { ...variables };

  let leadRecord = null;
  let contactRecord = null;
  let companyRecord = null;
  let dealRecord = null;

  if (entityType && entityId) {
    if (entityType === 'Lead') {
      leadRecord = await Lead.findOne({ _id: entityId, tenantId });
      if (leadRecord) {
        mergedVariables.firstName = mergedVariables.firstName || leadRecord.firstName;
        mergedVariables.lastName = mergedVariables.lastName || leadRecord.lastName;
        mergedVariables.company = mergedVariables.company || leadRecord.company;
        mergedVariables.jobTitle = mergedVariables.jobTitle || leadRecord.jobTitle;
      }
    } else if (entityType === 'Contact') {
      contactRecord = await Contact.findOne({ _id: entityId, tenantId });
      if (contactRecord) {
        mergedVariables.firstName = mergedVariables.firstName || contactRecord.firstName;
        mergedVariables.lastName = mergedVariables.lastName || contactRecord.lastName;
        mergedVariables.jobTitle = mergedVariables.jobTitle || contactRecord.jobTitle;
      }
    } else if (entityType === 'Company') {
      companyRecord = await Company.findOne({ _id: entityId, tenantId });
      if (companyRecord) {
        mergedVariables.company = mergedVariables.company || companyRecord.name;
      }
    } else if (entityType === 'Deal') {
      dealRecord = await Deal.findOne({ _id: entityId, tenantId });
      if (dealRecord) {
        mergedVariables.dealTitle = mergedVariables.dealTitle || dealRecord.title;
        mergedVariables.dealValue = mergedVariables.dealValue || `$${dealRecord.value?.toLocaleString()}`;
      }
    }
  }

  // Variable Interpolation
  const finalSubject = interpolateVariables(subject, mergedVariables);
  let finalHtml = interpolateVariables(bodyHtml, mergedVariables);
  const finalText = interpolateVariables(bodyText, mergedVariables);

  // Generate unique tracking identifier
  const trackingId = crypto.randomUUID();

  // Inject tracking pixel & click redirection
  finalHtml = wrapClickLinks(finalHtml, trackingId, baseUrl);
  finalHtml = injectTrackingPixel(finalHtml, trackingId, baseUrl);

  const senderAddress = from || process.env.EMAIL_FROM || 'NexusCRM <noreply@crmplatform.local>';

  let messageId = null;
  let sendStatus = 'Sent';
  let sendError = null;

  try {
    const info = await transporter.sendMail({
      from: senderAddress,
      to,
      cc,
      bcc,
      subject: finalSubject,
      html: finalHtml,
      text: finalText,
      headers: {
        'X-Nexus-Tracking-ID': trackingId,
      },
    });

    messageId = info.messageId || `msg_${Date.now()}`;
    logger.info(`Email sent to ${to} [TrackingId: ${trackingId}]`);
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    sendStatus = 'Failed';
    sendError = err.message;
  }

  // Create EmailLog record
  const emailLog = await EmailLog.create({
    tenantId,
    trackingId,
    to: to.toLowerCase().trim(),
    from: senderAddress,
    cc,
    bcc,
    subject: finalSubject,
    bodyHtml: finalHtml,
    bodyText: finalText,
    status: sendStatus,
    errorMessage: sendError,
    messageId,
    entityType: entityType || null,
    entityId: entityId || null,
    leadId: entityType === 'Lead' ? entityId : leadRecord?._id || null,
    contactId: entityType === 'Contact' ? entityId : contactRecord?._id || null,
    companyId: entityType === 'Company' ? entityId : companyRecord?._id || null,
    dealId: entityType === 'Deal' ? entityId : dealRecord?._id || null,
    campaignId: campaignId || null,
    templateId: templateId || null,
    sentBy: userId,
  });

  // Automatically record an Activity in the entity's timeline
  if (entityType && entityId && sendStatus === 'Sent') {
    try {
      await Activity.create({
        tenantId,
        type: 'Note',
        title: `Email Sent: ${finalSubject}`,
        description: `Outbound email dispatched to ${to}.\n\nSubject: ${finalSubject}\nTracking ID: ${trackingId}`,
        status: 'Completed',
        priority: 'Low',
        dueDate: new Date(),
        completedAt: new Date(),
        assignedTo: userId,
        createdBy: userId,
        entityType,
        entityId,
        leadId: entityType === 'Lead' ? entityId : null,
        contactId: entityType === 'Contact' ? entityId : null,
        companyId: entityType === 'Company' ? entityId : null,
        dealId: entityType === 'Deal' ? entityId : null,
      });
    } catch (actErr) {
      logger.warn(`Failed to auto-log email activity: ${actErr.message}`);
    }
  }

  return emailLog;
};

/**
 * Record email open event via 1x1 tracking pixel
 */
export const recordEmailOpen = async (trackingId, { ip = '', userAgent = '' } = {}) => {
  const email = await EmailLog.findOne({ trackingId });
  if (!email) return null;

  email.openCount += 1;
  email.status = 'Opened';
  if (!email.openedAt) {
    email.openedAt = new Date();
  }
  email.opens.push({
    openedAt: new Date(),
    ip,
    userAgent,
  });

  await email.save();

  // If associated with a campaign, update campaign stats
  if (email.campaignId) {
    await Campaign.updateOne(
      { _id: email.campaignId, tenantId: email.tenantId },
      { $inc: { 'stats.openedCount': 1 } }
    );
  }

  logger.info(`Email tracking pixel opened: ${trackingId} (Count: ${email.openCount})`);
  return email;
};

/**
 * Record email click event and redirect
 */
export const recordEmailClick = async (trackingId, targetUrl, { ip = '', userAgent = '' } = {}) => {
  const email = await EmailLog.findOne({ trackingId });
  if (!email) return targetUrl;

  email.clickCount += 1;
  email.status = 'Clicked';
  if (!email.clickedAt) {
    email.clickedAt = new Date();
  }
  if (!email.openedAt) {
    email.openedAt = new Date();
  }
  email.clicks.push({
    url: targetUrl,
    clickedAt: new Date(),
    ip,
    userAgent,
  });

  await email.save();

  // If associated with a campaign, update campaign stats
  if (email.campaignId) {
    await Campaign.updateOne(
      { _id: email.campaignId, tenantId: email.tenantId },
      { $inc: { 'stats.clickedCount': 1 } }
    );
  }

  logger.info(`Email link clicked: ${trackingId} -> ${targetUrl} (Count: ${email.clickCount})`);
  return targetUrl;
};

/**
 * List email logs with pagination and filters
 */
export const getEmailLogs = async ({
  tenantId,
  page = 1,
  limit = 25,
  to = '',
  status = '',
  entityType = '',
  entityId = '',
  campaignId = '',
  search = '',
  startDate = null,
  endDate = null,
}) => {
  const query = { tenantId };

  if (to) query.to = { $regex: to.trim(), $options: 'i' };
  if (status) query.status = status;
  if (campaignId) query.campaignId = campaignId;

  if (entityType && entityId) {
    query.$or = [
      { entityType, entityId },
      ...(entityType === 'Lead' ? [{ leadId: entityId }] : []),
      ...(entityType === 'Contact' ? [{ contactId: entityId }] : []),
      ...(entityType === 'Company' ? [{ companyId: entityId }] : []),
      ...(entityType === 'Deal' ? [{ dealId: entityId }] : []),
    ];
  }

  if (search) {
    query.$or = [
      { subject: { $regex: search.trim(), $options: 'i' } },
      { to: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [emails, total, statsAggregation] = await Promise.all([
    EmailLog.find(query)
      .populate('sentBy', 'firstName lastName email avatar')
      .populate('leadId', 'firstName lastName email')
      .populate('contactId', 'firstName lastName email')
      .populate('companyId', 'name')
      .populate('dealId', 'title')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    EmailLog.countDocuments(query),
    EmailLog.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          totalSent: { $sum: 1 },
          opened: { $sum: { $cond: [{ $in: ['$status', ['Opened', 'Clicked']] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ['$status', 'Clicked'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const stats = statsAggregation[0] || { totalSent: 0, opened: 0, clicked: 0, failed: 0 };
  const openRate = stats.totalSent > 0 ? ((stats.opened / stats.totalSent) * 100).toFixed(1) : 0;
  const clickRate = stats.totalSent > 0 ? ((stats.clicked / stats.totalSent) * 100).toFixed(1) : 0;

  return {
    emails,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
    stats: {
      ...stats,
      openRate: Number(openRate),
      clickRate: Number(clickRate),
    },
  };
};

/**
 * Get single email log details
 */
export const getEmailLogById = async ({ tenantId, id }) => {
  const email = await EmailLog.findOne({ _id: id, tenantId })
    .populate('sentBy', 'firstName lastName email')
    .populate('leadId', 'firstName lastName email')
    .populate('contactId', 'firstName lastName email')
    .populate('companyId', 'name')
    .populate('dealId', 'title')
    .populate('campaignId', 'name');

  if (!email) throw new AppError('Email log not found', 404);
  return email;
};
