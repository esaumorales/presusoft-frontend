import { axiosClient } from '../../../core/api/axiosClient';

export const dependenciesService = {
  create: (moduleId, data) => axiosClient.post(`/dependencies/modules/${moduleId}`, data),
  update: (id, data) => axiosClient.patch(`/dependencies/${id}`, data),
  remove: (id) => axiosClient.delete(`/dependencies/${id}`),
};
