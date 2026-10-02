import { getAuditLogs, getAuditStats, exportAuditLogsToCsv } from '../services/auditService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getLogs = async (req, res, next) => {
  try {
    const { page, limit, entity, action, actorId, startDate, endDate, search } = req.query;
    const result = await getAuditLogs({
      tenantId: req.tenantId || req.user.tenantId,
      page,
      limit,
      entity,
      action,
      actorId,
      startDate,
      endDate,
      search,
    });

    return sendSuccess(
      res,
      'Audit logs retrieved successfully',
      result.logs,
      200,
      result.pagination
    );
  } catch (err) {
    return next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await getAuditStats(req.tenantId || req.user.tenantId);
    return sendSuccess(res, 'Audit stats retrieved successfully', stats);
  } catch (err) {
    return next(err);
  }
};

export const exportLogs = async (req, res, next) => {
  try {
    const { entity, action, actorId, startDate, endDate } = req.query;
    const csvData = await exportAuditLogsToCsv({
      tenantId: req.tenantId || req.user.tenantId,
      entity,
      action,
      actorId,
      startDate,
      endDate,
    });

    const filename = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  } catch (err) {
    return next(err);
  }
};
