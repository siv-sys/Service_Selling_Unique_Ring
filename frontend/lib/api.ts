const API_BASE_URL = '/api';

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
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
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
};
