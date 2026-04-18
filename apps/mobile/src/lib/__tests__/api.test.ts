import { useAuthStore } from '../auth-store';
import { api, ApiError } from '../api';

// Mock fetch globally
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Mock URL since it doesn't fully work in RN test env
class MockURL {
  toString() { return this._url; }
  searchParams: URLSearchParams;
  private _url: string;
  constructor(path: string, base: string) {
    this.searchParams = new URLSearchParams();
    this._url = `${base}${path}`;
  }
}
(global as any).URL = MockURL;

beforeEach(() => {
  mockFetch.mockReset();
  useAuthStore.setState({
    user: null,
    accessToken: 'test_token',
    refreshToken: 'test_refresh',
    isLoading: false,
    isAuthenticated: true,
  });
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

describe('api client', () => {
  describe('ApiError', () => {
    it('has status and message', () => {
      const err = new ApiError(404, 'Not found');
      expect(err.status).toBe(404);
      expect(err.message).toBe('Not found');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('api.get', () => {
    it('makes GET request with auth header', async () => {
      mockFetch.mockReturnValue(jsonResponse({ data: [1, 2, 3] }));

      const result = await api.get<{ data: number[] }>('/items');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/items');
      expect(opts.method).toBe('GET');
      expect(opts.headers['Authorization']).toBe('Bearer test_token');
      expect(opts.headers['x-platform']).toBe('mobile');
      expect(opts.body).toBeUndefined();
      expect(result).toEqual({ data: [1, 2, 3] });
    });
  });

  describe('api.post', () => {
    it('makes POST request with JSON body', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: '1' }, 201));

      const result = await api.post('/items', { name: 'Test' });

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe('POST');
      expect(opts.body).toBe(JSON.stringify({ name: 'Test' }));
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('api.patch', () => {
    it('makes PATCH request', async () => {
      mockFetch.mockReturnValue(jsonResponse({ updated: true }));

      await api.patch('/items/1', { name: 'Updated' });

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe('PATCH');
      expect(opts.body).toBe(JSON.stringify({ name: 'Updated' }));
    });
  });

  describe('api.delete', () => {
    it('makes DELETE request', async () => {
      mockFetch.mockReturnValue(jsonResponse({ deleted: true }));

      await api.delete('/items/1');

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('error handling', () => {
    it('throws ApiError on non-OK response', async () => {
      mockFetch.mockReturnValue(jsonResponse({ error: 'Bad Request' }, 400));

      await expect(api.get('/fail')).rejects.toThrow(ApiError);
      await expect(api.get('/fail')).rejects.toMatchObject({
        status: 400,
        message: 'Bad Request',
      });
    });

    it('uses message field from response', async () => {
      mockFetch.mockReturnValue(jsonResponse({ message: 'Validation failed' }, 422));

      await expect(api.post('/fail', {})).rejects.toMatchObject({
        status: 422,
        message: 'Validation failed',
      });
    });
  });

  describe('auto-refresh on 401', () => {
    it('retries request after successful token refresh', async () => {
      // First call: 401
      mockFetch.mockReturnValueOnce(jsonResponse({ error: 'Unauthorized' }, 401));
      // Refresh call: success
      mockFetch.mockReturnValueOnce(
        jsonResponse({ accessToken: 'new_tok', refreshToken: 'new_ref' }),
      );
      // Retry: success
      mockFetch.mockReturnValueOnce(jsonResponse({ data: 'ok' }));

      const result = await api.get('/protected');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      // Second call should be refresh
      const [refreshUrl, refreshOpts] = mockFetch.mock.calls[1];
      expect(refreshUrl).toContain('/api/auth/refresh');
      expect(JSON.parse(refreshOpts.body)).toEqual({ refreshToken: 'test_refresh' });
      expect(result).toEqual({ data: 'ok' });
    });

    it('throws and logs out when refresh fails', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ error: 'Unauthorized' }, 401));
      mockFetch.mockReturnValueOnce(jsonResponse({ error: 'Invalid' }, 401));

      await expect(api.get('/protected')).rejects.toThrow('Session expired');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('does not retry if no token present', async () => {
      useAuthStore.setState({ accessToken: null });
      mockFetch.mockReturnValue(jsonResponse({ error: 'Unauthorized' }, 401));

      // 401 but no token → just throw error, no refresh attempt
      await expect(api.get('/protected')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('unauthenticated requests', () => {
    it('omits Authorization header when no token', async () => {
      useAuthStore.setState({ accessToken: null });
      mockFetch.mockReturnValue(jsonResponse({ ok: true }));

      await api.post('/auth/login', { email: 'a', password: 'b' });

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['Authorization']).toBeUndefined();
    });
  });
});
