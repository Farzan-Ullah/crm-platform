import {
  sendDirectEmail,
  getEmailLogs,
  getEmailLogById,
  recordEmailOpen,
  recordEmailClick,
  TRACKING_PIXEL_GIF,
} from '../services/emailService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const sendEmail = async (req, res, next) => {
  try {
    const {
      to,
      from,
      cc,
      bcc,
      subject,
      bodyHtml,
      bodyText,
      templateId,
      entityType,
      entityId,
      variables,
    } = req.body;

    const emailLog = await sendDirectEmail({
      tenantId: req.tenantId,
      userId: req.user._id,
      to,
      from,
      cc,
      bcc,
      subject,
      bodyHtml,
      bodyText,
      templateId,
      entityType,
      entityId,
      variables,
    });

    return sendSuccess(res, 'Email dispatched successfully', emailLog, 201);
  } catch (err) {
    return next(err);
  }
};

export const getEmails = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      to,
      status,
      entityType,
      entityId,
      campaignId,
      search,
      startDate,
      endDate,
    } = req.query;

    const result = await getEmailLogs({
      tenantId: req.tenantId,
      page,
      limit,
      to,
      status,
      entityType,
      entityId,
      campaignId,
      search,
      startDate,
      endDate,
    });

    const responseData = {
      emails: result.emails,
      stats: result.stats,
    };

    return sendSuccess(res, 'Email logs fetched successfully', responseData, 200, result.pagination);
  } catch (err) {
    return next(err);
  }
};

export const getEmailDetails = async (req, res, next) => {
  try {
    const email = await getEmailLogById({
      tenantId: req.tenantId,
      id: req.params.id,
    });
    return sendSuccess(res, 'Email log details fetched', email);
  } catch (err) {
    return next(err);
  }
};

/**
 * Public 1x1 tracking pixel endpoint
 */
export const trackOpen = async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    await recordEmailOpen(trackingId, { ip, userAgent });

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL_GIF.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    return res.end(TRACKING_PIXEL_GIF);
  } catch (err) {
    // Fail silently with pixel even if DB record fails
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL_GIF.length,
    });
    return res.end(TRACKING_PIXEL_GIF);
  }
};

/**
 * Public click link redirection endpoint
 */
export const trackClick = async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    const targetUrl = req.query.target || 'http://localhost:5173';
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    await recordEmailClick(trackingId, targetUrl, { ip, userAgent });

    return res.redirect(302, targetUrl);
  } catch (err) {
    const targetUrl = req.query.target || 'http://localhost:5173';
    return res.redirect(302, targetUrl);
  }
};
