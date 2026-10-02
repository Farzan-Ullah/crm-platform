import { create } from 'zustand';
import { authApi } from '../api/authApi.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initializeAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.getMe();
      if (response.success && response.data.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('crm_access_token');
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('crm_access_token');
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.login(credentials);
      if (response.success && response.data.user) {
        if (response.data.accessToken && typeof window !== 'undefined') {
          localStorage.setItem('crm_access_token', response.data.accessToken);
        }
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return {
        success: false,
        message: err.message || 'Invalid email or password',
        errors: err.errors || [],
      };
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Continue client logout even if network fails
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('crm_access_token');
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

// Listen for global unauthorized events to automatically reset auth state
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
