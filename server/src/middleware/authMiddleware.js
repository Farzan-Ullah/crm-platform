import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Try reading from signed/unsigned cookies
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Fallback to Authorization Header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Verify user exists and is active
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return next(new AppError('The user belonging to this session no longer exists.', 401, 'UNAUTHORIZED'));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact an administrator.', 403, 'ACCOUNT_DISABLED'));
    }

    // Attach user and tenant info to request
    req.user = user;
    req.tenantId = user.tenantId;

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please refresh your token.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
  }
};
