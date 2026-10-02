import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../config/logger.js';
import Papa from 'papaparse';

export const logAuditEvent = async ({
  tenantId,
  actorId,
  action,
  entity,
  entityId = null,
  before = null,
  after = null,
  ip = '',
  userAgent = '',
}) => {
  try {
    await AuditLog.create({
      tenantId,
      actorId,
      action,
      entity,
      entityId,
      before,
      after,
      ip,
      userAgent,
    });
  } catch (err) {
    logger.error(`Failed to record audit log: ${err.message}`);
  }
};

export const getAuditLogs = async ({
  tenantId,
  page = 1,
  limit = 25,
  entity,
  action,
  actorId,
  startDate,
  endDate,
  search,
}) => {
  const query = { tenantId };

  if (entity) {
    query.entity = entity;
  }
  if (action) {
    query.action = action;
  }
  if (actorId) {
    query.actorId = actorId;
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  if (search) {
    query.$or = [
      { action: { $regex: search, $options: 'i' } },
      { entity: { $regex: search, $options: 'i' } },
      { ip: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('actorId', 'firstName lastName email role avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit),
    },
  };
};

export const getAuditStats = async (tenantId) => {
  const [totalCount, actionsBreakdown, entitiesBreakdown, recent24h] = await Promise.all([
    AuditLog.countDocuments({ tenantId }),
    AuditLog.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    AuditLog.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$entity', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    AuditLog.countDocuments({
      tenantId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
  ]);

  return {
    totalEvents: totalCount,
    last24HoursEvents: recent24h,
    actionsBreakdown: actionsBreakdown.map((a) => ({ action: a._id, count: a.count })),
    entitiesBreakdown: entitiesBreakdown.map((e) => ({ entity: e._id, count: e.count })),
  };
};

export const exportAuditLogsToCsv = async ({ tenantId, entity, action, actorId, startDate, endDate }) => {
  const query = { tenantId };
  if (entity) query.entity = entity;
  if (action) query.action = action;
  if (actorId) query.actorId = actorId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(query)
    .populate('actorId', 'firstName lastName email role')
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  const flatRows = logs.map((log) => ({
    Timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : '',
    ActorName: log.actorId ? `${log.actorId.firstName} ${log.actorId.lastName}` : 'System',
    ActorEmail: log.actorId ? log.actorId.email : 'system@internal',
    ActorRole: log.actorId ? log.actorId.role : 'SYSTEM',
    Action: log.action,
    Entity: log.entity,
    EntityId: log.entityId ? log.entityId.toString() : '',
    IpAddress: log.ip || '',
    UserAgent: log.userAgent || '',
    BeforeChange: log.before ? JSON.stringify(log.before) : '',
    AfterChange: log.after ? JSON.stringify(log.after) : '',
  }));

  return Papa.unparse(flatRows);
};
