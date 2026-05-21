import { axiosClient } from '../../../core/api/axiosClient';

export const budgetCostsService = {
  create: (data)    => axiosClient.post('/budget-costs', data),
  getById: (id)     => axiosClient.get(`/budget-costs/${id}`),
  update: (id, data) => axiosClient.patch(`/budget-costs/${id}`, data),
  remove: (id)      => axiosClient.delete(`/budget-costs/${id}`),
};
