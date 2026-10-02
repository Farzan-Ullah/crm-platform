import { apiClient } from './apiClient.js';

export const importExportApi = {
  previewImport: async (formData) => {
    const res = await apiClient.post('/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  executeImport: async (formData) => {
    const res = await apiClient.post('/import/execute', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  downloadTemplate: async (entity = 'Lead') => {
    const res = await apiClient.get(`/import/template/${entity}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${entity.toLowerCase()}_sample_template.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadErrorReport: async (errors) => {
    const res = await apiClient.post(
      '/import/errors-report',
      { errors },
      { responseType: 'blob' }
    );

    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `import_failure_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportData: async (entity, format = 'csv') => {
    const res = await apiClient.get(`/export/${entity}`, {
      params: { format },
      responseType: 'blob',
    });

    const ext = format.toLowerCase() === 'xlsx' ? 'xlsx' : 'csv';
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${entity.toLowerCase()}_export_${new Date().toISOString().slice(0, 10)}.${ext}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
