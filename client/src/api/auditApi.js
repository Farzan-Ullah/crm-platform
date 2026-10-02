import { apiClient } from './apiClient.js';

export const auditApi = {
  getAuditLogs: async (params = {}) => {
    const res = await apiClient.get('/audit-logs', { params });
    return res;
  },

  getAuditStats: async () => {
    const res = await apiClient.get('/audit-logs/stats');
    return res.data;
  },

  exportAuditLogs: async (params = {}) => {
    const res = await apiClient.get('/audit-logs/export', {
      params,
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
