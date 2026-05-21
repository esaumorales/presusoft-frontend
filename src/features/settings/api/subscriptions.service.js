import { axiosClient } from '../../../core/api/axiosClient';

export const subscriptionsService = {
  create: (data) => axiosClient.post('/subscriptions', data),
  getAll: () => axiosClient.get('/subscriptions'),
  getById: (id) => axiosClient.get(`/subscriptions/${id}`),
  update: (id, data) => axiosClient.patch(`/subscriptions/${id}`, data),
  delete: (id) => axiosClient.delete(`/subscriptions/${id}`),
};
