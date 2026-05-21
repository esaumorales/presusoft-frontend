import { axiosClient } from '../../../core/api/axiosClient';

export const projectsService = {
  getAll: (params) => axiosClient.get('/projects', { params }),
  getById: (id, currency) => axiosClient.get(`/projects/${id}`, { params: { currency } }),
  create: (data) => axiosClient.post('/projects', data),
  update: (id, data) => axiosClient.patch(`/projects/${id}`, data),
  remove: (id) => axiosClient.delete(`/projects/${id}`),
};
