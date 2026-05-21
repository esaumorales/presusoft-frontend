import { axiosClient } from '../../../core/api/axiosClient';

export const notificationsService = {
  getAll: () => axiosClient.get('/notifications'),
  markAsRead: (id) => axiosClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.patch('/notifications/read-all'),
  delete: (id) => axiosClient.delete(`/notifications/${id}`),
};
