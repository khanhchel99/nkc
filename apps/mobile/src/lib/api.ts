import { useAuthStore } from './auth-store';
import * as storage from './storage';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function getBaseUrl(): Promise<string> {
  return storage.getApiUrl();
}

async function request<T>(method: Method, path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
  const baseUrl = await getBaseUrl();
  const url = new URL(`/api${path}`, baseUrl);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }

  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-platform': 'mobile',
    'x-device-name': 'mobile-app',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${useAuthStore.getState().accessToken}`;
      res = await fetch(url.toString(), { method, headers, body: body ? JSON.stringify(body) : undefined });
    } else {
      await useAuthStore.getState().logout();
      throw new ApiError(401, 'Session expired');
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(res.status, data.error || data.message || 'Request failed');
  }
  return data as T;
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) => request<T>('GET', path, undefined, params),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
