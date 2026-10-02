import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ENV.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const getCookieOptions = (isRefresh = false) => {
  const isProduction = ENV.NODE_ENV === 'production';
  const maxAge = isRefresh ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000; // 7 days or 15 minutes

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge,
    path: '/',
  };
};
