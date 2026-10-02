import {
  getTenantSettings,
  updateTenantSettings,
  testSmtpConnection,
} from '../services/tenantService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await getTenantSettings(req.tenantId || req.user.tenantId);
    return sendSuccess(res, 'Tenant settings retrieved successfully', settings);
  } catch (err) {
    return next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { company, localization, sales, smtp } = req.body;
    const updated = await updateTenantSettings({
      tenantId: req.tenantId || req.user.tenantId,
      actorId: req.user._id,
      company,
      localization,
      sales,
      smtp,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });

    return sendSuccess(res, 'Tenant settings updated successfully', updated);
  } catch (err) {
    return next(err);
  }
};

export const testSmtp = async (req, res, next) => {
  try {
    const result = await testSmtpConnection(req.tenantId || req.user.tenantId, req.body.smtp);
    return sendSuccess(res, 'SMTP test executed', result);
  } catch (err) {
    return next(err);
  }
};
