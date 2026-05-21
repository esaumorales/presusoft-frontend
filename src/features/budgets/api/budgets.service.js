import { axiosClient } from '../../../core/api/axiosClient';

export const budgetsService = {
  getAll:       (params)    => axiosClient.get('/budgets', { params }),
  getById:      (id, currency) => axiosClient.get(`/budgets/${id}`, { params: { currency } }),
  create:       (data)      => axiosClient.post('/budgets', data),
  update:       (id, data)  => axiosClient.patch(`/budgets/${id}`, data),
  remove:       (id)        => axiosClient.delete(`/budgets/${id}`),
  calculate:    (id)        => axiosClient.post(`/budgets/${id}/calculate`),
  changeStatus: (id, status) => axiosClient.patch(`/budgets/${id}/status`, { status }),
  duplicate:    (id)        => axiosClient.post(`/budgets/${id}/duplicate`),
};
