import { axiosClient } from '../../../core/api/axiosClient';

export const companiesService = {
  getAll:  ()          => axiosClient.get('/companies'),
  getById: (id)        => axiosClient.get(`/companies/${id}`),
  create:  (data)      => axiosClient.post('/companies', data),
  update:  (id, data)  => axiosClient.patch(`/companies/${id}`, data),
  remove:  (id)        => axiosClient.delete(`/companies/${id}`),
};
