import { axiosClient } from '../../../core/api/axiosClient';

export const budgetModulesService = {
  create: (projectId, data) => axiosClient.post(`/modules/projects/${projectId}`, data),
  getById: (id)             => axiosClient.get(`/modules/${id}`),
  update: (id, data)        => axiosClient.patch(`/modules/${id}`, data),
  remove: (id)              => axiosClient.delete(`/modules/${id}`),
};
