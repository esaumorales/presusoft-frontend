import { axiosClient } from '../../../core/api/axiosClient';

export const exportsService = {
  exportToPdf: (budgetId) => axiosClient.post(`/exports/budget/${budgetId}/pdf`),
  exportToWord: (budgetId) => axiosClient.post(`/exports/budget/${budgetId}/word`),
  exportToExcel: (budgetId) => axiosClient.post(`/exports/budget/${budgetId}/excel`),
  getExportHistory: (budgetId) => axiosClient.get(`/exports/budget/${budgetId}`),
  downloadFile: (filename) => axiosClient.get(`/exports/download/${filename}`, { responseType: 'blob' }),
};
