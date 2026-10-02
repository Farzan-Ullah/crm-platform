import { apiClient } from './apiClient.js';

export const pipelinesApi = {
  getPipelines: async () => {
    return apiClient.get('/pipelines');
  },

  getPipeline: async (id) => {
    return apiClient.get(`/pipelines/${id}`);
  },

  createPipeline: async (data) => {
    return apiClient.post('/pipelines', data);
  },

  updatePipeline: async (id, data) => {
    return apiClient.patch(`/pipelines/${id}`, data);
  },

  deletePipeline: async (id) => {
    return apiClient.delete(`/pipelines/${id}`);
  },
};
