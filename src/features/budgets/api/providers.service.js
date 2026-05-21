import { axiosClient } from '../../../core/api/axiosClient';

export const providersService = {
  getAll: () => axiosClient.get('/providers'),
  create: (data) => axiosClient.post('/providers', data),
};
