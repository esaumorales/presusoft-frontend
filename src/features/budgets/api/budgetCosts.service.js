import { axiosClient } from '../../../core/api/axiosClient';

export const budgetCostsService = {
  create: (moduleId, data) => axiosClient.post(`/dependencies/modules/${moduleId}`, data),
  getById: (id)            => axiosClient.get(`/dependencies/${id}`),
  update: (id, data)       => axiosClient.patch(`/dependencies/${id}`, data),
  remove: (id)             => axiosClient.delete(`/dependencies/${id}`),
};
