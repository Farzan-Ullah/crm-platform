import { apiClient } from './apiClient.js';

export const contactsApi = {
  getContacts: async (params = {}) => {
    return apiClient.get('/contacts', { params });
  },

  getContact: async (id) => {
    return apiClient.get(`/contacts/${id}`);
  },

  createContact: async (data) => {
    return apiClient.post('/contacts', data);
  },

  updateContact: async (id, data) => {
    return apiClient.patch(`/contacts/${id}`, data);
  },

  deleteContact: async (id) => {
    return apiClient.delete(`/contacts/${id}`);
  },

  mergeContacts: async (data) => {
    return apiClient.post('/contacts/merge', data);
  },

  checkDuplicates: async (params = {}) => {
    return apiClient.get('/contacts/duplicates', { params });
  },

  convertLead: async (leadId, data) => {
    return apiClient.post(`/leads/${leadId}/convert`, data);
  },
};
