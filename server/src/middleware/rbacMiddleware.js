import { AppError } from '../utils/AppError.js';
import { ROLE_PERMISSIONS, ROLES } from '../constants/roles.js';

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    const userRole = req.user.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (!permissions.includes(permission)) {
      return next(
        new AppError(
          `Forbidden: You lack the required permission '${permission}'`,
          403,
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
};

export const requireOwnershipOrManager = (getOwnerIdFn) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
      }

      // Admins and Sales Managers can view/modify all records within their tenant
      if ([ROLES.ADMIN, ROLES.SALES_MANAGER].includes(req.user.role)) {
        return next();
      }

      const ownerId = await getOwnerIdFn(req);
      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        return next(
          new AppError(
            'Forbidden: You are only authorized to access records you own.',
            403,
            'FORBIDDEN'
          )
        );
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};
