export const THEME_STORAGE_KEY = 'darkMode';
export const THEME_EVENT = 'bondkeeper-theme-change';

export function isStoredDarkModeEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(THEME_STORAGE_KEY) === 'true';
}

export function applyTheme(isDarkMode: boolean) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', isDarkMode);
  document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
}

export function syncStoredTheme() {
  applyTheme(isStoredDarkModeEnabled());
}

export function setDarkModePreference(isDarkMode: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, String(isDarkMode));
  }

  applyTheme(isDarkMode);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: isDarkMode }));
  }
}
