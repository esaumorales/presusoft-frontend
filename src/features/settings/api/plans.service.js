import { axiosClient } from '../../../core/api/axiosClient';

export const plansService = {
  create: (data) => axiosClient.post('/plans', data),
  getAll: () => axiosClient.get('/plans'),
  getById: (id) => axiosClient.get(`/plans/${id}`),
  update: (id, data) => axiosClient.patch(`/plans/${id}`, data),
  delete: (id) => axiosClient.delete(`/plans/${id}`),
};
