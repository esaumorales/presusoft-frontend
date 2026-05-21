import { axiosClient } from '../../../core/api/axiosClient';

export const authService = {
  register:      (data)      => axiosClient.post('/auth/register', data),
  login:         (data)      => axiosClient.post('/auth/login', data),
  getProfile:    ()          => axiosClient.get('/auth/profile'),
  updateProfile: (id, data)  => axiosClient.patch(`/users/${id}`, data),
};
