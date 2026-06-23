import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../features/iam/users/types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;

  // Actions
  setAuth: (accessToken: string, user: User, permissions: string[]) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      permissions: [],
      isAuthenticated: false,

      setAuth: (accessToken, user, permissions) =>
        set({
          accessToken,
          user,
          permissions,
          isAuthenticated: true,
        }),

      updateUser: (user) =>
        set((state) => ({
          ...state,
          user,
        })),

      logout: () =>
        set({
          accessToken: null,
          user: null,
          permissions: [],
          isAuthenticated: false,
        }),
    }),
    {
      name: 'iam-auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
