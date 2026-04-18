import { create } from 'zustand';
import * as storage from './storage';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: async () => {
    const [user, accessToken, refreshToken] = await Promise.all([
      storage.getUser(),
      storage.getAccessToken(),
      storage.getRefreshToken(),
    ]);
    set({
      user: user as AuthUser | null,
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken && !!user,
      isLoading: false,
    });
  },

  setAuth: async (user, accessToken, refreshToken) => {
    await Promise.all([
      storage.setUser(user as unknown as Record<string, unknown>),
      storage.setAccessToken(accessToken),
      storage.setRefreshToken(refreshToken),
    ]);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      storage.setAccessToken(accessToken),
      storage.setRefreshToken(refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },

  logout: async () => {
    await storage.clearAll();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
