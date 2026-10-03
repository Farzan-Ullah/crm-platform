import {
  loginUser,
  refreshSession,
  logoutUser,
  changeUserPassword,
  getCurrentUserProfile,
  updateUserProfile,
  getUserSessions,
  revokeUserSession,
  revokeAllOtherSessions,
} from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getCookieOptions } from '../utils/tokenUtils.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const { user, accessToken, refreshToken } = await loginUser({
      email,
      password,
      ip,
      userAgent,
    });

    // Set secure HTTP-only cookies
    res.cookie('accessToken', accessToken, getCookieOptions(false));
    res.cookie('refreshToken', refreshToken, getCookieOptions(true));

    return sendSuccess(res, 'Login successful', {
      user,
      accessToken, // Also sent in payload for clients preferring Authorization headers
    });
  } catch (err) {
    return next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const { user, accessToken, refreshToken: newRefreshToken } = await refreshSession(
      refreshToken,
      ip,
      userAgent
    );

    res.cookie('accessToken', accessToken, getCookieOptions(false));
    res.cookie('refreshToken', newRefreshToken, getCookieOptions(true));

    return sendSuccess(res, 'Session refreshed successfully', {
      user,
      accessToken,
    });
  } catch (err) {
    return next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await logoutUser(refreshToken, req.user, ip, userAgent);

    // Clear authentication cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return sendSuccess(res, 'Logged out successfully');
  } catch (err) {
    return next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUserProfile(req.user._id);
    return sendSuccess(res, 'User profile fetched successfully', { user });
  } catch (err) {
    return next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await changeUserPassword({
      userId: req.user._id,
      currentPassword,
      newPassword,
      ip,
      userAgent,
    });

    // Clear cookies as sessions have been revoked
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return sendSuccess(res, 'Password changed successfully. Please log in with your new password.');
  } catch (err) {
    return next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;
    const user = await updateUserProfile({
      userId: req.user._id,
      tenantId: req.tenantId,
      firstName,
      lastName,
      phone,
      avatar,
    });
    return sendSuccess(res, 'Profile updated successfully', { user });
  } catch (err) {
    return next(err);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const sessions = await getUserSessions({
      userId: req.user._id,
      tenantId: req.tenantId,
      currentRefreshToken: refreshToken,
    });
    return sendSuccess(res, 'Active sessions retrieved', { sessions });
  } catch (err) {
    return next(err);
  }
};

export const revokeSession = async (req, res, next) => {
  try {
    const result = await revokeUserSession({
      userId: req.user._id,
      tenantId: req.tenantId,
      sessionId: req.params.id,
    });
    return sendSuccess(res, 'Session revoked successfully', result);
  } catch (err) {
    return next(err);
  }
};

export const revokeOtherSessions = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await revokeAllOtherSessions({
      userId: req.user._id,
      tenantId: req.tenantId,
      currentRefreshToken: refreshToken,
    });
    return sendSuccess(res, 'All other sessions revoked', result);
  } catch (err) {
    return next(err);
  }
};
