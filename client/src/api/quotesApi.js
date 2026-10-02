import { apiClient } from './apiClient.js';

export const quotesApi = {
  getQuotes: async (params = {}) => {
    return apiClient.get('/quotes', { params });
  },

  getQuote: async (id) => {
    return apiClient.get(`/quotes/${id}`);
  },

  getQuoteStats: async () => {
    return apiClient.get('/quotes/stats');
  },

  createQuote: async (data) => {
    return apiClient.post('/quotes', data);
  },

  updateQuote: async (id, data) => {
    return apiClient.put(`/quotes/${id}`, data);
  },

  deleteQuote: async (id) => {
    return apiClient.delete(`/quotes/${id}`);
  },

  approveQuote: async (id) => {
    return apiClient.post(`/quotes/${id}/approve`);
  },

  rejectQuote: async (id, data) => {
    return apiClient.post(`/quotes/${id}/reject`, data);
  },

  sendQuote: async (id, data = {}) => {
    return apiClient.post(`/quotes/${id}/send`, data);
  },

  acceptQuote: async (id, data = { syncDeal: true }) => {
    return apiClient.post(`/quotes/${id}/accept`, data);
  },

  declineQuote: async (id, data = {}) => {
    return apiClient.post(`/quotes/${id}/decline`, data);
  },

  getPdfUrl: (id, download = false) => {
    const base = import.meta.env.VITE_API_URL || '/api/v1';
    return `${base}/quotes/${id}/pdf${download ? '?download=true' : ''}`;
  },
};
