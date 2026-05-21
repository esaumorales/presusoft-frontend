import { axiosClient } from '../../../core/api/axiosClient';

export const usersService = {
  getAll: () => axiosClient.get('/users'),
  getById: (id) => axiosClient.get(`/users/${id}`),
  update: (id, data) => axiosClient.patch(`/users/${id}`, data),
  delete: (id) => axiosClient.delete(`/users/${id}`),
};
