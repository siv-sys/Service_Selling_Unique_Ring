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
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

// User Rings API
export interface UserRing {
  id: number;
  userId: number;
  ringId: number;
  status: 'ASSIGNED' | 'AVAILABLE' | 'PENDING' | 'UNASSIGNED';
  assignedAt: string;
  updatedAt: string;
  user?: {
    username: string;
    fullName: string;
    email: string;
  };
  ring?: {
    identifier: string;
    name: string;
    material: string;
    size: string;
    modelName: string;
    collectionName: string;
    imageUrl?: string;
    basePrice?: number;
    stockStatus?: string;
    locationType?: string;
    locationLabel?: string;
    batteryLevel?: number;
    lastSeenAt?: string;
  };
}

export interface UserRingsResponse {
  userRings: UserRing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface UserRingsByUserResponse {
  userRings: UserRing[];
}

export const userRingsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.status) queryParams.append('status', params.status);
    const query = queryParams.toString();
    return api.get<UserRingsResponse>(`/user-rings${query ? `?${query}` : ''}`);
  },

  getByUserId: (userId: number) =>
    api.get<UserRingsByUserResponse>(`/user-rings/user/${userId}`),

  getById: (id: number) =>
    api.get<UserRing>(`/user-rings/${id}`),

  assign: (data: { userId: number; ringId: number; status?: string }) =>
    api.post<UserRing>('/user-rings', data),

  updateStatus: (id: number, status: string) =>
    api.patch<UserRing>(`/user-rings/${id}`, { status }),

  unassign: (id: number) =>
    api.patch<UserRing>(`/user-rings/${id}`, { status: 'UNASSIGNED' }),

  remove: (id: number) =>
    api.delete<void>(`/user-rings/${id}`),
};
