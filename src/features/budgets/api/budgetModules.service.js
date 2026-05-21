import { axiosClient } from '../../../core/api/axiosClient';

export const budgetModulesService = {
  create: (data)    => axiosClient.post('/budget-modules', data),
  getById: (id)     => axiosClient.get(`/budget-modules/${id}`),
  update: (id, data) => axiosClient.patch(`/budget-modules/${id}`, data),
  remove: (id)      => axiosClient.delete(`/budget-modules/${id}`),
};
