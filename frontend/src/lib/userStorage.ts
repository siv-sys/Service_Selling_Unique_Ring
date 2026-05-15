const AUTH_USER_ID_STORAGE_KEY = 'auth_user_id';

export function getStoredAuthValue(key: string): string | null {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

export function getCurrentAuthUserId(): string | null {
  const rawUserId = getStoredAuthValue(AUTH_USER_ID_STORAGE_KEY);
  const normalizedUserId = String(rawUserId || '').trim();
  return normalizedUserId || null;
}

export function getUserScopedStorageKey(baseKey: string): string | null {
  const userId = getCurrentAuthUserId();
  return userId ? `${baseKey}:${userId}` : null;
}

export function getUserScopedLocalStorageItem(baseKey: string): string | null {
  const scopedKey = getUserScopedStorageKey(baseKey);
  if (!scopedKey) {
    return null;
  }

  try {
    return localStorage.getItem(scopedKey);
  } catch {
    return null;
  }
}

export function setUserScopedLocalStorageItem(baseKey: string, value: string): boolean {
  const scopedKey = getUserScopedStorageKey(baseKey);
  if (!scopedKey) {
    return false;
  }

  try {
    localStorage.setItem(scopedKey, value);
    return true;
  } catch {
    return false;
  }
}

export function removeUserScopedLocalStorageItem(baseKey: string): boolean {
  const scopedKey = getUserScopedStorageKey(baseKey);
  if (!scopedKey) {
    return false;
  }

  try {
    localStorage.removeItem(scopedKey);
    return true;
  } catch {
    return false;
  }
}

export function getUserScopedSessionStorageItem(baseKey: string): string | null {
  const scopedKey = getUserScopedStorageKey(baseKey);
  if (!scopedKey) {
    return null;
  }

  try {
    return sessionStorage.getItem(scopedKey);
  } catch {
    return null;
  }
}

export function setUserScopedSessionStorageItem(baseKey: string, value: string): boolean {
  const scopedKey = getUserScopedStorageKey(baseKey);
  if (!scopedKey) {
    return false;
  }

  try {
    sessionStorage.setItem(scopedKey, value);
    return true;
  } catch {
    return false;
  }
}

export function removeUserScopedSessionStorageItem(baseKey: string): boolean {
  const scopedKey = getUserScopedStorageKey(baseKey);
  if (!scopedKey) {
    return false;
  }

  try {
    sessionStorage.removeItem(scopedKey);
    return true;
  } catch {
    return false;
  }
}
