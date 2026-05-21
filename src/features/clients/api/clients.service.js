import { axiosClient } from '../../../core/api/axiosClient';

export const clientsService = {
  getAll:  ()       => axiosClient.get('/clients'),
  getById: (id)     => axiosClient.get(`/clients/${id}`),
  create:  (data)   => axiosClient.post('/clients', data),
  update:  (id, data) => axiosClient.patch(`/clients/${id}`, data),
  remove:  (id)     => axiosClient.delete(`/clients/${id}`),
};
