import { exportEntities } from '../services/exportService.js';

export const exportData = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const { format = 'csv' } = req.query;

    const result = await exportEntities({
      tenantId: req.tenantId || req.user.tenantId,
      actorId: req.user._id,
      entity,
      format,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    if (result.type === 'buffer') {
      return res.send(Buffer.from(result.data));
    } else {
      return res.status(200).send(result.data);
    }
  } catch (err) {
    return next(err);
  }
};
