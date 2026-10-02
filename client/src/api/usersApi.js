import { apiClient } from './apiClient.js';

export const usersApi = {
  getUsers: async (params = {}) => {
    return apiClient.get('/users', { params });
  },

  getSalesReps: async () => {
    return apiClient.get('/users/reps');
  },

  createUser: async (data) => {
    return apiClient.post('/users', data);
  },

  updateUser: async (id, data) => {
    return apiClient.patch(`/users/${id}`, data);
  },
};

export const teamsApi = {
  getTeams: async () => {
    return apiClient.get('/teams');
  },

  createTeam: async (data) => {
    return apiClient.post('/teams', data);
  },

  updateTeam: async (id, data) => {
    return apiClient.patch(`/teams/${id}`, data);
  },

  deleteTeam: async (id) => {
    return apiClient.delete(`/teams/${id}`);
  },
};
