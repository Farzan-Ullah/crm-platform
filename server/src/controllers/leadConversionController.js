import { convertLeadToAccount } from '../services/leadConversionService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const convertLead = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await convertLeadToAccount({
      leadId: req.params.id,
      tenantId: req.tenantId,
      actorId: req.user._id,
      ...req.body,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'Lead converted successfully', result, 200);
  } catch (err) {
    return next(err);
  }
};
