import { useAuthStore } from '../store/authStore.js';
import { ROLES } from '../constants/roles.js';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuthStore();

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.SALES_MANAGER;
  const isRep = user?.role === ROLES.SALES_EXECUTIVE;
  const isSupport = user?.role === ROLES.SUPPORT_AGENT;

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    role: user?.role,
    isAdmin,
    isManager,
    isRep,
    isSupport,
    tenant: user?.tenant,
  };
};
