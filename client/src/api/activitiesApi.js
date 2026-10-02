import { apiClient } from './apiClient.js';

export const activitiesApi = {
  getActivities: async (params = {}) => {
    return apiClient.get('/activities', { params });
  },

  getCalendar: async (params = {}) => {
    return apiClient.get('/activities/calendar', { params });
  },

  getUpcoming: async (params = {}) => {
    return apiClient.get('/activities/upcoming', { params });
  },

  getTimeline: async (entityType, entityId, params = {}) => {
    return apiClient.get(`/activities/timeline/${entityType}/${entityId}`, { params });
  },

  getActivity: async (id) => {
    return apiClient.get(`/activities/${id}`);
  },

  createActivity: async (data) => {
    return apiClient.post('/activities', data);
  },

  updateActivity: async (id, data) => {
    return apiClient.patch(`/activities/${id}`, data);
  },

  toggleComplete: async (id) => {
    return apiClient.patch(`/activities/${id}/complete`);
  },

  deleteActivity: async (id) => {
    return apiClient.delete(`/activities/${id}`);
  },
};
