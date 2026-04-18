'use client';

import { create } from 'zustand';

interface AuthUser {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('nkc_user') || 'null') : null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('nkc_access_token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('nkc_refresh_token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('nkc_access_token') : false,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('nkc_user', JSON.stringify(user));
    localStorage.setItem('nkc_access_token', accessToken);
    localStorage.setItem('nkc_refresh_token', refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('nkc_access_token', accessToken);
    localStorage.setItem('nkc_refresh_token', refreshToken);
    set({ accessToken, refreshToken });
  },

  logout: () => {
    localStorage.removeItem('nkc_user');
    localStorage.removeItem('nkc_access_token');
    localStorage.removeItem('nkc_refresh_token');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
