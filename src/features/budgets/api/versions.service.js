import { axiosClient } from '../../../core/api/axiosClient';

export const versionsService = {
  getByBudgetId: (budgetId) => axiosClient.get(`/versions/budget/${budgetId}`),
  createSnapshot: (budgetId) => axiosClient.post(`/versions/budget/${budgetId}`),
  restore: (versionId) => axiosClient.post(`/versions/${versionId}/restore`),
};
