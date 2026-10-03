import { apiClient } from './apiClient.js';

export const notificationsApi = {
  getNotifications: async (params = {}) => {
    return apiClient.get('/notifications', { params });
  },

  getUnreadCount: async () => {
    return apiClient.get('/notifications/unread-count');
  },

  markAsRead: async (id) => {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return apiClient.patch('/notifications/mark-all-read');
  },

  deleteNotification: async (id) => {
    return apiClient.delete(`/notifications/${id}`);
  },
};
