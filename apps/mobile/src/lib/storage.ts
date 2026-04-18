import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'nkc_access_token',
  refreshToken: 'nkc_refresh_token',
  user: 'nkc_user',
  apiUrl: 'nkc_api_url',
} as const;

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.accessToken);
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.accessToken, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refreshToken);
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.refreshToken, token);
}

export async function getUser(): Promise<Record<string, unknown> | null> {
  const raw = await SecureStore.getItemAsync(KEYS.user);
  return raw ? JSON.parse(raw) : null;
}

export async function setUser(user: Record<string, unknown>): Promise<void> {
  await SecureStore.setItemAsync(KEYS.user, JSON.stringify(user));
}

export async function getApiUrl(): Promise<string> {
  const url = await SecureStore.getItemAsync(KEYS.apiUrl);
  return url || 'http://localhost:3100';
}

export async function setApiUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.apiUrl, url);
}

export async function clearAll(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)),
  );
}
