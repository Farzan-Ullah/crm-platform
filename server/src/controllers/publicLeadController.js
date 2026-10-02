import { Tenant } from '../models/Tenant.js';
import { createNewLead } from '../services/leadService.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const capturePublicLead = async (req, res, next) => {
  try {
    const { tenantSubdomain, firstName, lastName, email, phone, company, notes, source, hpField } = req.body;

    // Spam Honeypot Protection: Bots automatically fill hidden fields
    if (hpField && hpField.trim().length > 0) {
      // Silently return success to mislead the spam bot without inserting data
      return sendSuccess(res, 'Thank you! Your inquiry has been received.', {}, 200);
    }

    const tenant = await Tenant.findOne({ subdomain: tenantSubdomain.toLowerCase().trim() });
    if (!tenant) {
      throw new AppError('Tenant not found.', 404, 'NOT_FOUND');
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const lead = await createNewLead({
      tenantId: tenant._id,
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        notes,
        source: source || 'Website',
        status: 'New',
      },
      actorId: null,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'Thank you! Your inquiry has been received.', {
      leadId: lead._id,
    }, 201);
  } catch (err) {
    return next(err);
  }
};
