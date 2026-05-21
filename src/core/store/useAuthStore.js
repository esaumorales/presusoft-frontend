import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (userData, token) => {
        set({ user: userData, token, isAuthenticated: true });
      },

      // Actualiza solo los datos del usuario (útil tras llamar a /profile)
      setUser: (userData) => {
        set({ user: userData });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'presusoft-auth', // clave en localStorage
      // Solo persistimos token y user, no funciones
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
