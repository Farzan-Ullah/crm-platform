import { apiClient } from './apiClient.js';

export const reportsApi = {
  getSummary: async (params = {}) => {
    return apiClient.get('/reports/summary', { params });
  },

  getFunnel: async (params = {}) => {
    return apiClient.get('/reports/funnel', { params });
  },

  getForecast: async (params = {}) => {
    return apiClient.get('/reports/forecast', { params });
  },

  getLeaderboard: async (params = {}) => {
    return apiClient.get('/reports/leaderboard', { params });
  },

  getSources: async (params = {}) => {
    return apiClient.get('/reports/sources', { params });
  },

  getWinLoss: async (params = {}) => {
    return apiClient.get('/reports/win-loss', { params });
  },

  getActivities: async (params = {}) => {
    return apiClient.get('/reports/activities', { params });
  },
};
