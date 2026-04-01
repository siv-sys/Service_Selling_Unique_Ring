const LOCAL_API_BASE_URL = 'http://localhost:4001/api';

export const API_BASE_URL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? LOCAL_API_BASE_URL
    : '/api';

export function resolveApiAssetUrl(url: string | null | undefined): string {
  if (!url) return '';

  const trimmed = String(url).trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    try {
      const apiUrl = new URL(API_BASE_URL, window.location.origin);
      return new URL(trimmed, apiUrl.origin).toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  provider?: string | null;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  accessToken: string;
  expiresAt: string;
  rememberToken?: string | null;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterResponse extends MessageResponse {
  user: AuthUser;
  accessToken?: string;
  expiresAt?: string;
}

function getStoredAuthValue(key: string): string | null {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function buildAuthHeaders(): HeadersInit {
  const userId = getStoredAuthValue('auth_user_id');
  const roles = getStoredAuthValue('auth_roles');
  const sessionToken = getStoredAuthValue('auth_session_token');
  const accessToken = getStoredAuthValue('auth_access_token');

  return {
    ...(userId ? { 'x-auth-user-id': userId } : {}),
    ...(roles ? { 'x-auth-roles': roles } : {}),
    ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null);
      const message =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    const message = await response.text().catch(() => '');
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return (await response.text()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  login: (payload: { email: string; password: string; remember: boolean }) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  googleLogin: (payload: { email: string; providerId?: string; name?: string }) =>
    request<LoginResponse>('/auth/login/google', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: { email: string; password: string; name?: string; role?: 'admin' | 'user'; autoLogin?: boolean }) =>
    request<RegisterResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<RegisterResponse>('/auth/me'),
  logout: (payload?: { all?: boolean }) =>
    request<MessageResponse>('/auth/logout', { method: 'POST', body: JSON.stringify(payload || {}) }),
  resetPassword: (payload: { email: string; newPassword: string }) =>
    request<MessageResponse>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
};
