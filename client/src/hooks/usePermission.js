import { useAuthStore } from '../store/authStore.js';
import { ROLE_PERMISSIONS, ROLES } from '../constants/permissions.js';

export const usePermission = () => {
  const user = useAuthStore((state) => state.user);

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === ROLES.ADMIN) return true;

    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    hasPermission,
    hasRole,
  };
};
