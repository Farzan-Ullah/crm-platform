import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { logAuditEvent } from './auditService.js';

export const getTeamsList = async (tenantId) => {
  return Team.find({ tenantId })
    .populate('managerId', 'firstName lastName email avatar')
    .populate('memberIds', 'firstName lastName email avatar role')
    .sort({ createdAt: -1 })
    .lean();
};

export const createNewTeam = async ({
  tenantId,
  data,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const existing = await Team.findOne({ tenantId, name: data.name.trim() });
  if (existing) {
    throw new AppError('A team with this name already exists.', 409, 'CONFLICT');
  }

  const team = await Team.create({
    tenantId,
    name: data.name.trim(),
    managerId: data.managerId || null,
    memberIds: data.memberIds || [],
    description: data.description || '',
  });

  // Assign members to this team in User model
  if (data.memberIds && data.memberIds.length > 0) {
    await User.updateMany(
      { _id: { $in: data.memberIds }, tenantId },
      { $set: { teamId: team._id } }
    );
  }

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'CREATE_TEAM',
    entity: 'Team',
    entityId: team._id,
    after: { name: team.name },
    ip,
    userAgent,
  });

  return team;
};

export const updateTeamById = async ({
  teamId,
  tenantId,
  updates,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const team = await Team.findOne({ _id: teamId, tenantId });
  if (!team) {
    throw new AppError('Team not found.', 404, 'NOT_FOUND');
  }

  if (updates.name && updates.name !== team.name) {
    const existing = await Team.findOne({
      tenantId,
      name: updates.name.trim(),
      _id: { $ne: team._id },
    });
    if (existing) {
      throw new AppError('A team with this name already exists.', 409, 'CONFLICT');
    }
    team.name = updates.name.trim();
  }

  if (updates.managerId !== undefined) team.managerId = updates.managerId || null;
  if (updates.description !== undefined) team.description = updates.description;

  if (updates.memberIds) {
    // Unassign users previously in this team who were removed
    await User.updateMany(
      { teamId: team._id, _id: { $nin: updates.memberIds }, tenantId },
      { $set: { teamId: null } }
    );

    // Assign new members to this team
    await User.updateMany(
      { _id: { $in: updates.memberIds }, tenantId },
      { $set: { teamId: team._id } }
    );

    team.memberIds = updates.memberIds;
  }

  await team.save();

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE_TEAM',
    entity: 'Team',
    entityId: team._id,
    after: { name: team.name },
    ip,
    userAgent,
  });

  return team;
};

export const deleteTeamById = async ({ teamId, tenantId, actorId = null }) => {
  const team = await Team.findOneAndDelete({ _id: teamId, tenantId });
  if (!team) {
    throw new AppError('Team not found.', 404, 'NOT_FOUND');
  }

  // Clear teamId on members
  await User.updateMany({ teamId: team._id, tenantId }, { $set: { teamId: null } });

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'DELETE_TEAM',
    entity: 'Team',
    entityId: team._id,
    before: { name: team.name },
  });

  return true;
};
