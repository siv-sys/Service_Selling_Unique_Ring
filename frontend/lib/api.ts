const API_BASE_URL = '/api';

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
  rememberToken?: string | null;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterResponse extends MessageResponse {
  user: AuthUser;
}

function getStoredAuthValue(key: string): string | null {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function buildAuthHeaders(): HeadersInit {
  const userId = getStoredAuthValue('auth_user_id');
  const roles = getStoredAuthValue('auth_roles');

  return {
    ...(userId ? { 'x-auth-user-id': userId } : {}),
    ...(roles ? { 'x-auth-roles': roles } : {}),
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
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  login: (payload: { email: string; password: string; remember: boolean }) =>
    request<LoginResponse>('/login', { method: 'POST', body: JSON.stringify(payload) }),
  googleLogin: (payload: { email: string; providerId?: string; name?: string }) =>
    request<LoginResponse>('/login/google', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: { email: string; password: string; name?: string; role?: 'admin' | 'user' }) =>
    request<RegisterResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<RegisterResponse>('/auth/me'),
  logout: (payload?: { userId?: number }) =>
    request<MessageResponse>('/auth/logout', { method: 'POST', body: JSON.stringify(payload || {}) }),
  resetPassword: (payload: { email: string; newPassword: string }) =>
    request<MessageResponse>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
};
