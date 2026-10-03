import { apiClient } from './apiClient.js';

export const authApi = {
  login: async (credentials) => {
    return apiClient.post('/auth/login', credentials);
  },

  refresh: async () => {
    return apiClient.post('/auth/refresh');
  },

  logout: async () => {
    return apiClient.post('/auth/logout');
  },

  getMe: async () => {
    return apiClient.get('/auth/me');
  },

  changePassword: async (data) => {
    return apiClient.post('/auth/change-password', data);
  },

  updateProfile: async (data) => {
    return apiClient.patch('/auth/profile', data);
  },

  getSessions: async () => {
    return apiClient.get('/auth/sessions');
  },

  revokeSession: async (id) => {
    return apiClient.delete(`/auth/sessions/${id}`);
  },

  revokeOtherSessions: async () => {
    return apiClient.delete('/auth/sessions');
  },
};
