import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Tenant } from '../models/Tenant.js';
import { Team } from '../models/Team.js';
import { AppError } from '../utils/AppError.js';
import { comparePassword, hashPassword } from '../utils/passwordUtils.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/tokenUtils.js';
import { logAuditEvent } from './auditService.js';

export const loginUser = async ({ email, password, ip = '', userAgent = '' }) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'UNAUTHORIZED');
  }

  // Check if account is locked due to excessive failed attempts
  if (user.isLocked()) {
    const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    throw new AppError(
      `Account temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minutes.`,
      403,
      'ACCOUNT_LOCKED'
    );
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact an administrator.', 403, 'ACCOUNT_DISABLED');
  }

  // Verify password
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    await user.handleFailedLogin();
    throw new AppError('Invalid email or password.', 401, 'UNAUTHORIZED');
  }

  // Reset failed login counter and set lastLogin
  await user.handleSuccessfulLogin();

  // Token payloads
  const tokenPayload = {
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store hashed refresh token in Session collection
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await Session.create({
    tenantId: user.tenantId,
    userId: user._id,
    refreshTokenHash,
    ip,
    userAgent,
    expiresAt,
  });

  // Record audit log
  await logAuditEvent({
    tenantId: user.tenantId,
    actorId: user._id,
    action: 'LOGIN',
    entity: 'Auth',
    entityId: user._id,
    ip,
    userAgent,
  });

  // Sanitize user object for client
  const safeUser = user.toObject();
  delete safeUser.passwordHash;

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};

export const refreshSession = async (refreshToken, ip = '', userAgent = '') => {
  if (!refreshToken) {
    throw new AppError('Refresh token required.', 401, 'UNAUTHORIZED');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_TOKEN');
  }

  const tokenHash = hashToken(refreshToken);
  const session = await Session.findOne({ refreshTokenHash: tokenHash });

  if (!session) {
    throw new AppError('Session not found or has been revoked. Please log in again.', 401, 'UNAUTHORIZED');
  }

  const user = await User.findById(session.userId);
  if (!user || !user.isActive) {
    await Session.findByIdAndDelete(session._id);
    throw new AppError('User not found or account is deactivated.', 401, 'UNAUTHORIZED');
  }

  // Token rotation: Issue fresh access and refresh token pair
  const tokenPayload = {
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
    role: user.role,
    email: user.email,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Update session with new hash and expiration
  session.refreshTokenHash = hashToken(newRefreshToken);
  session.expiresAt = newExpiresAt;
  session.ip = ip;
  session.userAgent = userAgent;
  await session.save();

  const safeUser = user.toObject();
  delete safeUser.passwordHash;

  return {
    user: safeUser,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (refreshToken, user, ip = '', userAgent = '') => {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await Session.deleteOne({ refreshTokenHash: tokenHash });
  }

  if (user) {
    await logAuditEvent({
      tenantId: user.tenantId,
      actorId: user._id,
      action: 'LOGOUT',
      entity: 'Auth',
      entityId: user._id,
      ip,
      userAgent,
    });
  }

  return true;
};

export const changeUserPassword = async ({
  userId,
  currentPassword,
  newPassword,
  ip = '',
  userAgent = '',
}) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found.', 404, 'NOT_FOUND');
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Current password does not match.', 400, 'BAD_REQUEST');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // Invalidate all active sessions for this user across devices
  await Session.deleteMany({ userId: user._id });

  await logAuditEvent({
    tenantId: user.tenantId,
    actorId: user._id,
    action: 'CHANGE_PASSWORD',
    entity: 'User',
    entityId: user._id,
    ip,
    userAgent,
  });

  return true;
};

export const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate('teamId', 'name')
    .lean();

  if (!user) {
    throw new AppError('User not found.', 404, 'NOT_FOUND');
  }

  const tenant = await Tenant.findById(user.tenantId).lean();

  return {
    ...user,
    tenant: tenant ? { id: tenant._id, name: tenant.name, plan: tenant.subscription?.plan } : null,
  };
};
