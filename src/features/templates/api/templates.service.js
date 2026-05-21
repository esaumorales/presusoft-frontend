import { axiosClient } from '../../../core/api/axiosClient';

export const templatesService = {
  getAll:   ()            => axiosClient.get('/templates'),
  getById:  (id)          => axiosClient.get(`/templates/${id}`),
  create:   (data)        => axiosClient.post('/templates', data),
  update:   (id, data)    => axiosClient.patch(`/templates/${id}`, data),
  remove:   (id)          => axiosClient.delete(`/templates/${id}`),
  apply:    (id, budgetId) => axiosClient.post(`/templates/${id}/apply/${budgetId}`),
};
