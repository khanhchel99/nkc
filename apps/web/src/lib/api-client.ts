import { useAuthStore } from '@/stores/auth-store';

const BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3100';

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const token = useAuthStore.getState().accessToken;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse(res: Response) {
    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new Error('Phiên đăng nhập hết hạn');
      }
      throw new Error('RETRY');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Lỗi ${res.status}`);
    }
    return res.json();
  }

  private async refreshToken(): Promise<boolean> {
    const { refreshToken, setTokens } = useAuthStore.getState();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async get<T = unknown>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }
    const headers = await this.getHeaders();
    const res = await fetch(url.toString(), { headers });
    try {
      return await this.handleResponse(res);
    } catch (e) {
      if ((e as Error).message === 'RETRY') {
        const retryHeaders = await this.getHeaders();
        const retryRes = await fetch(url.toString(), { headers: retryHeaders });
        return this.handleResponse(retryRes);
      }
      throw e;
    }
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    try {
      return await this.handleResponse(res);
    } catch (e) {
      if ((e as Error).message === 'RETRY') {
        const retryHeaders = await this.getHeaders();
        const retryRes = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers: retryHeaders, body: body ? JSON.stringify(body) : undefined });
        return this.handleResponse(retryRes);
      }
      throw e;
    }
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    try {
      return await this.handleResponse(res);
    } catch (e) {
      if ((e as Error).message === 'RETRY') {
        const retryHeaders = await this.getHeaders();
        const retryRes = await fetch(`${BASE_URL}${path}`, { method: 'PATCH', headers: retryHeaders, body: body ? JSON.stringify(body) : undefined });
        return this.handleResponse(retryRes);
      }
      throw e;
    }
  }
}

export const api = new ApiClient();
