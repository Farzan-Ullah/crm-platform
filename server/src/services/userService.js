import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { ROLES } from '../constants/roles.js';
import { logAuditEvent } from './auditService.js';

export const getUsersList = async ({ tenantId, role, teamId, isActive }) => {
  const query = { tenantId };

  if (role) query.role = role;
  if (teamId) query.teamId = teamId;
  if (isActive !== undefined && isActive !== '') {
    query.isActive = isActive === 'true' || isActive === true;
  }

  return User.find(query)
    .populate('teamId', 'name')
    .sort({ createdAt: -1 })
    .lean();
};

export const createNewUser = async ({
  tenantId,
  data,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const existing = await User.findOne({ tenantId, email: data.email.toLowerCase() });
  if (existing) {
    throw new AppError('A user with this email address already exists in your organization.', 409, 'CONFLICT');
  }

  const passwordHash = await hashPassword(data.password || 'Password123!');

  const user = await User.create({
    tenantId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
    passwordHash,
    role: data.role || ROLES.SALES_EXECUTIVE,
    teamId: data.teamId || null,
    phone: data.phone || '',
    isActive: true,
  });

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'CREATE_USER',
    entity: 'User',
    entityId: user._id,
    after: { email: user.email, role: user.role, name: user.fullName },
    ip,
    userAgent,
  });

  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  return safeUser;
};

export const updateUserById = async ({
  userId,
  tenantId,
  updates,
  actorId = null,
  ip = '',
  userAgent = '',
}) => {
  const user = await User.findOne({ _id: userId, tenantId });
  if (!user) {
    throw new AppError('User not found.', 404, 'NOT_FOUND');
  }

  const beforeSnapshot = {
    role: user.role,
    teamId: user.teamId,
    isActive: user.isActive,
  };

  if (updates.firstName) user.firstName = updates.firstName;
  if (updates.lastName) user.lastName = updates.lastName;
  if (updates.role) user.role = updates.role;
  if (updates.teamId !== undefined) user.teamId = updates.teamId || null;
  if (updates.phone !== undefined) user.phone = updates.phone;
  if (updates.isActive !== undefined) user.isActive = updates.isActive;

  if (updates.password) {
    user.passwordHash = await hashPassword(updates.password);
  }

  await user.save();

  await logAuditEvent({
    tenantId,
    actorId,
    action: 'UPDATE_USER',
    entity: 'User',
    entityId: user._id,
    before: beforeSnapshot,
    after: { role: user.role, teamId: user.teamId, isActive: user.isActive },
    ip,
    userAgent,
  });

  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  return safeUser;
};

export const getActiveSalesReps = async (tenantId) => {
  return User.find({
    tenantId,
    isActive: true,
    role: { $in: [ROLES.SALES_EXECUTIVE, ROLES.SALES_MANAGER, ROLES.ADMIN] },
  })
    .select('firstName lastName email role teamId avatar')
    .sort({ firstName: 1 })
    .lean();
};
