import { apiClient } from './apiClient.js';

export const companiesApi = {
  getCompanies: async (params = {}) => {
    return apiClient.get('/companies', { params });
  },

  getCompany: async (id) => {
    return apiClient.get(`/companies/${id}`);
  },

  createCompany: async (data) => {
    return apiClient.post('/companies', data);
  },

  updateCompany: async (id, data) => {
    return apiClient.patch(`/companies/${id}`, data);
  },

  deleteCompany: async (id) => {
    return apiClient.delete(`/companies/${id}`);
  },

  checkDuplicates: async (params = {}) => {
    return apiClient.get('/companies/duplicates', { params });
  },
};
