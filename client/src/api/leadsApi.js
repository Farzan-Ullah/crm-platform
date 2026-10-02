import { apiClient } from './apiClient.js';

export const leadsApi = {
  getLeads: async (params = {}) => {
    return apiClient.get('/leads', { params });
  },

  getLead: async (id) => {
    return apiClient.get(`/leads/${id}`);
  },

  createLead: async (data) => {
    return apiClient.post('/leads', data);
  },

  updateLead: async (id, data) => {
    return apiClient.patch(`/leads/${id}`, data);
  },

  deleteLead: async (id) => {
    return apiClient.delete(`/leads/${id}`);
  },

  assignLead: async (id, ownerId) => {
    return apiClient.post(`/leads/${id}/assign`, { ownerId });
  },

  bulkUpdateStatus: async (leadIds, status) => {
    return apiClient.post('/leads/bulk-status', { leadIds, status });
  },

  bulkAssign: async (leadIds, ownerId) => {
    return apiClient.post('/leads/bulk-assign', { leadIds, ownerId });
  },

  bulkDelete: async (leadIds) => {
    return apiClient.post('/leads/bulk-delete', { leadIds });
  },

  checkDuplicate: async (params) => {
    return apiClient.get('/leads/duplicate-check', { params });
  },
};
