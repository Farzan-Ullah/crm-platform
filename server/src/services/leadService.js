import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { calculateLeadScore } from './leadScoringService.js';
import { getNextRoundRobinAssignee } from './leadAssignmentService.js';
import { logAuditEvent } from './auditService.js';
import { ROLES } from '../constants/roles.js';

export const createNewLead = async ({
  tenantId,
  data,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  // 1. Calculate automated lead score
  const { score } = await calculateLeadScore(data, tenantId);

  // 2. Determine lead ownership: manual or round-robin auto-assign
  let assignedOwnerId = data.ownerId;
  if (!assignedOwnerId) {
    assignedOwnerId = await getNextRoundRobinAssignee(tenantId);
  }

  // 3. Create lead in database
  const lead = await Lead.create({
    ...data,
    tenantId,
    score,
    ownerId: assignedOwnerId || null,
  });

  // 4. Log audit event
  await logAuditEvent({
    tenantId,
    actorId,
    action: 'CREATE',
    entity: 'Lead',
    entityId: lead._id,
    after: { name: lead.fullName, email: lead.email, status: lead.status },
    ip,
    userAgent,
  });

  return lead;
};

export const getLeadsList = async ({
  tenantId,
  user,
  page = 1,
  limit = 20,
  search = '',
  status = '',
  source = '',
  ownerId = '',
  scoreRange = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const query = { tenantId, isConverted: false };

  // Role scoping: Sales Executives only view leads assigned to them or unassigned pool
  if (user && user.role === ROLES.SALES_EXECUTIVE) {
    query.$or = [{ ownerId: user._id }, { ownerId: null }];
  } else if (ownerId) {
    query.ownerId = ownerId;
  }

  // Filter: Status
  if (status && status !== 'all') {
    query.status = status;
  }

  // Filter: Source
  if (source && source !== 'all') {
    query.source = source;
  }

  // Filter: Score Range
  if (scoreRange && scoreRange !== 'all') {
    if (scoreRange === 'cold') query.score = { $gte: 0, $lte: 29 };
    else if (scoreRange === 'warm') query.score = { $gte: 30, $lte: 59 };
    else if (scoreRange === 'hot') query.score = { $gte: 60, $lte: 79 };
    else if (scoreRange === 'very-hot') query.score = { $gte: 80, $lte: 100 };
  }

  // Search filter across text index or regex fallback
  if (search && search.trim().length > 0) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { company: searchRegex },
      { jobTitle: searchRegex },
    ];
  }

  // Pagination & Sorting calculation
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate('ownerId', 'firstName lastName email avatar role')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Lead.countDocuments(query),
  ]);

  return {
    leads,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const getLeadDetails = async (leadId, tenantId) => {
  const lead = await Lead.findOne({ _id: leadId, tenantId })
    .populate('ownerId', 'firstName lastName email phone avatar role')
    .lean();

  if (!lead) {
    throw new AppError('Lead not found.', 404, 'NOT_FOUND');
  }

  // Calculate live score breakdown for the details UI
  const { score, category, breakdown } = await calculateLeadScore(lead, tenantId);

  return {
    ...lead,
    score,
    scoreCategory: category,
    scoreBreakdown: breakdown,
  };
};

export const updateLeadById = async ({
  leadId,
  tenantId,
  updates,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const lead = await Lead.findOne({ _id: leadId, tenantId });
  if (!lead) {
    throw new AppError('Lead not found.', 404, 'NOT_FOUND');
  }

  const beforeSnapshot = lead.toObject();

  // Apply updates
  Object.assign(lead, updates);

  // Recalculate lead score if scoring attributes changed
  const { score } = await calculateLeadScore(lead, tenantId);
  lead.score = score;

  await lead.save();

  // Log audit event
  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE',
    entity: 'Lead',
    entityId: lead._id,
    before: beforeSnapshot,
    after: lead.toObject(),
    ip,
    userAgent,
  });

  return lead;
};

export const deleteLeadById = async ({
  leadId,
  tenantId,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const lead = await Lead.findOneAndDelete({ _id: leadId, tenantId });
  if (!lead) {
    throw new AppError('Lead not found.', 404, 'NOT_FOUND');
  }

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'DELETE',
    entity: 'Lead',
    entityId: lead._id,
    before: { name: lead.fullName, email: lead.email },
    ip,
    userAgent,
  });

  return true;
};

export const bulkUpdateLeadStatus = async ({
  leadIds,
  status,
  tenantId,
  actorId = null,
}) => {
  const result = await Lead.updateMany(
    { _id: { $in: leadIds }, tenantId },
    { $set: { status } }
  );

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'BULK_UPDATE_STATUS',
    entity: 'Lead',
    after: { modifiedCount: result.modifiedCount, newStatus: status },
  });

  return result;
};

export const bulkAssignLeads = async ({
  leadIds,
  ownerId,
  tenantId,
  actorId = null,
}) => {
  let targetOwnerId = ownerId;

  if (ownerId === 'round-robin') {
    targetOwnerId = await getNextRoundRobinAssignee(tenantId);
  }

  const result = await Lead.updateMany(
    { _id: { $in: leadIds }, tenantId },
    { $set: { ownerId: targetOwnerId } }
  );

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'BULK_ASSIGN',
    entity: 'Lead',
    after: { modifiedCount: result.modifiedCount, ownerId: targetOwnerId },
  });

  return result;
};

export const bulkDeleteLeads = async ({ leadIds, tenantId, actorId = null }) => {
  const result = await Lead.deleteMany({ _id: { $in: leadIds }, tenantId });

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'BULK_DELETE',
    entity: 'Lead',
    after: { deletedCount: result.deletedCount },
  });

  return result;
};

export const checkForDuplicateLead = async ({ email, phone, tenantId, excludeId = null }) => {
  const query = { tenantId };
  const conditions = [];

  if (email && email.trim()) {
    conditions.push({ email: email.trim().toLowerCase() });
  }
  if (phone && phone.trim()) {
    conditions.push({ phone: phone.trim() });
  }

  if (conditions.length === 0) return null;

  query.$or = conditions;
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Lead.findOne(query)
    .populate('ownerId', 'firstName lastName')
    .lean();

  return existing;
};
