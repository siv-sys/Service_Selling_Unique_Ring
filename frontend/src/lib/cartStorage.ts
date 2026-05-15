import { getStoredAuthValue, getUserScopedLocalStorageItem, removeUserScopedLocalStorageItem, setUserScopedLocalStorageItem } from './userStorage';

const CART_STORAGE_KEY = 'cart';
const CART_SESSION_KEY = 'sessionId';

export type StoredCartItem = Record<string, unknown>;

export function getCartOwnerId(): string | null {
  const rawUserId = getStoredAuthValue('auth_user_id');
  const normalizedUserId = String(rawUserId || '').trim();
  return normalizedUserId || null;
}

export function getCartSessionId(): string | null {
  return getUserScopedLocalStorageItem(CART_SESSION_KEY) || getCartOwnerId();
}

export function setCartSessionId(sessionId: string): boolean {
  return setUserScopedLocalStorageItem(CART_SESSION_KEY, sessionId);
}

export function getCartRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const ownerId = getCartOwnerId();
  const sessionId = getUserScopedLocalStorageItem(CART_SESSION_KEY);

  if (ownerId) {
    headers['x-auth-user-id'] = ownerId;
  }

  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  return headers;
}

export function getStoredCartItems<T = StoredCartItem>(): T[] {
  try {
    const raw = getUserScopedLocalStorageItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function setStoredCartItems(items: unknown[]): boolean {
  try {
    return setUserScopedLocalStorageItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    return false;
  }
}

export function clearStoredCartItems(): boolean {
  return removeUserScopedLocalStorageItem(CART_STORAGE_KEY);
}
