import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Setting } from '../models/Setting.js';
import { ROLES } from '../constants/roles.js';
import { AppError } from '../utils/AppError.js';
import { logAuditEvent } from './auditService.js';

export const getNextRoundRobinAssignee = async (tenantId, teamId = null) => {
  // Query active sales executives in this tenant
  const query = {
    tenantId,
    role: ROLES.SALES_EXECUTIVE,
    isActive: true,
  };

  if (teamId) {
    query.teamId = teamId;
  }

  const activeReps = await User.find(query).sort({ _id: 1 }).lean();

  if (!activeReps || activeReps.length === 0) {
    // If no sales executives found, fallback to sales managers or admin
    const fallbackUser = await User.findOne({
      tenantId,
      role: { $in: [ROLES.SALES_MANAGER, ROLES.ADMIN] },
      isActive: true,
    }).lean();

    return fallbackUser ? fallbackUser._id : null;
  }

  // Workload-balanced round-robin:
  // Count un-converted leads assigned to each active rep
  const repIds = activeReps.map((r) => r._id);
  const workloadCounts = await Lead.aggregate([
    {
      $match: {
        tenantId,
        ownerId: { $in: repIds },
        isConverted: false,
        status: { $nin: ['Unqualified', 'Lost'] },
      },
    },
    {
      $group: {
        _id: '$ownerId',
        openLeads: { $sum: 1 },
      },
    },
  ]);

  const workloadMap = new Map();
  workloadCounts.forEach((w) => workloadMap.set(w._id.toString(), w.openLeads));

  // Sort reps primarily by lowest workload, secondarily by ID for deterministic fairness
  activeReps.sort((a, b) => {
    const countA = workloadMap.get(a._id.toString()) || 0;
    const countB = workloadMap.get(b._id.toString()) || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a._id.toString().localeCompare(b._id.toString());
  });

  return activeReps[0]._id;
};

export const assignLeadToRep = async ({
  leadId,
  tenantId,
  ownerId,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const lead = await Lead.findOne({ _id: leadId, tenantId });
  if (!lead) {
    throw new AppError('Lead not found.', 404, 'NOT_FOUND');
  }

  const previousOwnerId = lead.ownerId;

  // Verify owner is active user in tenant
  const targetRep = await User.findOne({ _id: ownerId, tenantId, isActive: true });
  if (!targetRep) {
    throw new AppError('Assigned representative is either inactive or not found.', 400, 'BAD_REQUEST');
  }

  lead.ownerId = targetRep._id;
  await lead.save();

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'ASSIGN',
    entity: 'Lead',
    entityId: lead._id,
    before: { ownerId: previousOwnerId },
    after: { ownerId: targetRep._id, repName: targetRep.fullName },
    ip,
    userAgent,
  });

  return lead;
};
