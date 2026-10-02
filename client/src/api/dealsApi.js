import { apiClient } from './apiClient.js';

export const dealsApi = {
  getDeals: async (params = {}) => {
    return apiClient.get('/deals', { params });
  },

  getKanban: async (params = {}) => {
    return apiClient.get('/deals/kanban', { params });
  },

  getForecast: async (params = {}) => {
    return apiClient.get('/deals/forecast', { params });
  },

  getDeal: async (id) => {
    return apiClient.get(`/deals/${id}`);
  },

  createDeal: async (data) => {
    return apiClient.post('/deals', data);
  },

  updateDeal: async (id, data) => {
    return apiClient.patch(`/deals/${id}`, data);
  },

  updateDealStage: async (id, data) => {
    return apiClient.patch(`/deals/${id}/stage`, data);
  },

  deleteDeal: async (id) => {
    return apiClient.delete(`/deals/${id}`);
  },
};
