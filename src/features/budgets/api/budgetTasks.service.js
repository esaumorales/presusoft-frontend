import { axiosClient } from '../../../core/api/axiosClient';

export const budgetTasksService = {
  create: (moduleId, data) => axiosClient.post(`/tasks/modules/${moduleId}`, data),
  getById: (id)            => axiosClient.get(`/tasks/${id}`),
  update: (id, data)       => axiosClient.patch(`/tasks/${id}`, data),
  remove: (id)             => axiosClient.delete(`/tasks/${id}`),
};
