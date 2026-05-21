import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Crea una instancia de Axios centralizada
export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el Token en cada petición
axiosClient.interceptors.request.use(
  (config) => {
    // Obtenemos el token directamente del estado de Zustand
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas (ej: Token expirado)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el backend dice que no autorizado, cerramos sesión automáticamente
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
