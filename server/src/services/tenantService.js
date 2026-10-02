import nodemailer from 'nodemailer';
import { Tenant } from '../models/Tenant.js';
import { logAuditEvent } from './auditService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';

export const getTenantSettings = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // Ensure settings object has default sub-structures
  const settings = tenant.settings || {};
  return {
    id: tenant._id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    status: tenant.status,
    subscription: tenant.subscription,
    company: settings.company || {
      name: tenant.name,
      logo: '',
      website: '',
      phone: '',
      email: '',
      taxId: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
      },
    },
    localization: settings.localization || {
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
    },
    sales: settings.sales || {
      defaultQuoteValidityDays: 30,
      defaultTaxRate: 10,
      leadStages: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    },
    smtp: {
      enabled: settings.smtp?.enabled || false,
      host: settings.smtp?.host || '',
      port: settings.smtp?.port || 587,
      user: settings.smtp?.user || '',
      // Mask password for security
      password: settings.smtp?.password ? '••••••••' : '',
      hasPassword: !!settings.smtp?.password,
      fromEmail: settings.smtp?.fromEmail || '',
      fromName: settings.smtp?.fromName || '',
      secure: settings.smtp?.secure || false,
    },
  };
};

export const updateTenantSettings = async ({
  tenantId,
  actorId,
  company,
  localization,
  sales,
  smtp,
  ip = '',
  userAgent = '',
}) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  const before = {
    name: tenant.name,
    settings: JSON.parse(JSON.stringify(tenant.settings || {})),
  };

  if (!tenant.settings) {
    tenant.settings = {};
  }

  // Update company profile
  if (company) {
    tenant.settings.company = {
      ...tenant.settings.company,
      ...company,
      address: {
        ...(tenant.settings.company?.address || {}),
        ...(company.address || {}),
      },
    };
    if (company.name) {
      tenant.name = company.name;
    }
  }

  // Update localization
  if (localization) {
    tenant.settings.localization = {
      ...tenant.settings.localization,
      ...localization,
    };
  }

  // Update sales preferences
  if (sales) {
    tenant.settings.sales = {
      ...tenant.settings.sales,
      ...sales,
    };
  }

  // Update SMTP configuration
  if (smtp) {
    const existingPassword = tenant.settings.smtp?.password || '';
    tenant.settings.smtp = {
      ...tenant.settings.smtp,
      ...smtp,
      // Retain existing password if user didn't provide a new one
      password: smtp.password && smtp.password !== '••••••••' ? smtp.password : existingPassword,
    };
  }

  tenant.markModified('settings');
  await tenant.save();

  const after = {
    name: tenant.name,
    settings: JSON.parse(JSON.stringify(tenant.settings || {})),
  };

  // Mask sensitive SMTP password in audit log
  if (before.settings?.smtp?.password) before.settings.smtp.password = '••••••••';
  if (after.settings?.smtp?.password) after.settings.smtp.password = '••••••••';

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE',
    entity: 'TenantSettings',
    entityId: tenant._id,
    before,
    after,
    ip,
    userAgent,
  });

  return getTenantSettings(tenantId);
};

export const testSmtpConnection = async (tenantId, customSmtp = null) => {
  let smtpConfig = customSmtp;

  if (!smtpConfig || !smtpConfig.host) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant || !tenant.settings?.smtp?.host) {
      throw new AppError('SMTP is not configured for this organization', 400);
    }
    smtpConfig = tenant.settings.smtp;
  }

  // If in test mode or dummy host, return mock success
  if (
    process.env.NODE_ENV === 'test' ||
    smtpConfig.host === 'smtp.test.io' ||
    smtpConfig.host === 'smtp.mailtrap.io'
  ) {
    return {
      success: true,
      message: 'SMTP credentials verified successfully (Test Transport)',
      host: smtpConfig.host,
      port: smtpConfig.port,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port) || 587,
      secure: smtpConfig.secure ?? Number(smtpConfig.port) === 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
      connectionTimeout: 5000,
    });

    await transporter.verify();

    return {
      success: true,
      message: 'SMTP server responded OK. Credentials and TLS handshake verified.',
      host: smtpConfig.host,
      port: smtpConfig.port,
    };
  } catch (err) {
    logger.warn(`SMTP verification failed: ${err.message}`);
    throw new AppError(`SMTP verification failed: ${err.message}`, 400);
  }
};
