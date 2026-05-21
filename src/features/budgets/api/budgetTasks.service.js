import { axiosClient } from '../../../core/api/axiosClient';

export const budgetTasksService = {
  create: (data)    => axiosClient.post('/budget-tasks', data),
  getById: (id)     => axiosClient.get(`/budget-tasks/${id}`),
  update: (id, data) => axiosClient.patch(`/budget-tasks/${id}`, data),
  remove: (id)      => axiosClient.delete(`/budget-tasks/${id}`),
};
