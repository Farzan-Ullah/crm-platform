import { apiClient } from './apiClient.js';

export const emailsApi = {
  // Direct Emails & Logs
  getEmails: async (params = {}) => {
    return apiClient.get('/emails', { params });
  },

  getEmail: async (id) => {
    return apiClient.get(`/emails/${id}`);
  },

  sendEmail: async (data) => {
    return apiClient.post('/emails/send', data);
  },

  // Templates
  getTemplates: async (params = {}) => {
    return apiClient.get('/email-templates', { params });
  },

  getTemplate: async (id) => {
    return apiClient.get(`/email-templates/${id}`);
  },

  createTemplate: async (data) => {
    return apiClient.post('/email-templates', data);
  },

  updateTemplate: async (id, data) => {
    return apiClient.patch(`/email-templates/${id}`, data);
  },

  deleteTemplate: async (id) => {
    return apiClient.delete(`/email-templates/${id}`);
  },

  previewTemplate: async (templateId, data = {}) => {
    return apiClient.post(`/email-templates/${templateId}/preview`, data);
  },

  // Campaigns
  getCampaigns: async (params = {}) => {
    return apiClient.get('/campaigns', { params });
  },

  getCampaign: async (id) => {
    return apiClient.get(`/campaigns/${id}`);
  },

  createCampaign: async (data) => {
    return apiClient.post('/campaigns', data);
  },

  updateCampaign: async (id, data) => {
    return apiClient.patch(`/campaigns/${id}`, data);
  },

  deleteCampaign: async (id) => {
    return apiClient.delete(`/campaigns/${id}`);
  },

  estimateAudience: async (data) => {
    return apiClient.post('/campaigns/estimate-audience', data);
  },

  launchCampaign: async (id) => {
    return apiClient.post(`/campaigns/${id}/launch`);
  },
};
