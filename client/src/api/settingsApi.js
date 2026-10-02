import { apiClient } from './apiClient.js';

export const settingsApi = {
  getSettings: async () => {
    const res = await apiClient.get('/tenant/settings');
    return res.data;
  },

  updateSettings: async (data) => {
    const res = await apiClient.patch('/tenant/settings', data);
    return res.data;
  },

  testSmtp: async (smtp) => {
    const res = await apiClient.post('/tenant/settings/test-smtp', { smtp });
    return res.data;
  },
};
