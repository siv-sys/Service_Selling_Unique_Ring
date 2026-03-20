import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { api, API_BASE_URL } from '../lib/api';
import { isStoredDarkModeEnabled, setDarkModePreference } from '../lib/theme';
import {
  getStoredAuthValue,
  getUserScopedLocalStorageItem,
  setUserScopedLocalStorageItem,
  removeUserScopedLocalStorageItem,
} from '../lib/userStorage';
const PURCHASED_RING_STORAGE_KEY = 'bondKeeper_purchased_ring';
const USER_AVATAR_STORAGE_KEY = 'bondkeeper_user_avatar_url';
const USER_AVATAR_UPDATED_EVENT = 'bondkeeper:user-avatar-updated';
const USER_PROFILE_UPDATED_EVENT = 'bondkeeper:user-profile-updated';

type NavItem = {
  label: string;
  to: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Couple Shop', to: '/shop' },
  { label: 'My Ring', to: '/myring' },
  { label: 'Couple Profile', to: '/couple-profile' },
  { label: 'Relationship', to: '/relationship' },
];

function readStoredUserAvatar() {
  return getUserScopedLocalStorageItem(USER_AVATAR_STORAGE_KEY);
}

export default function UserShell({ children }: PropsWithChildren) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [displayName, setDisplayName] = useState('Alex & Jamie');
  const [hasPurchasedRing, setHasPurchasedRing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => readStoredUserAvatar());

  useEffect(() => {
    const savedDarkMode = isStoredDarkModeEnabled();
    setIsDarkMode(savedDarkMode);

    const authName = sessionStorage.getItem('auth_name')?.trim();
    setDisplayName(authName || 'Member');
    setHasPurchasedRing(Boolean(getUserScopedLocalStorageItem(PURCHASED_RING_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    const syncPurchasedRingState = () => {
      setHasPurchasedRing(Boolean(getUserScopedLocalStorageItem(PURCHASED_RING_STORAGE_KEY)));
    };

    window.addEventListener('storage', syncPurchasedRingState);
    window.addEventListener('focus', syncPurchasedRingState);
    return () => {
      window.removeEventListener('storage', syncPurchasedRingState);
      window.removeEventListener('focus', syncPurchasedRingState);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const syncAvatarFromStorage = () => {
      if (!active) return;
      setAvatarUrl(readStoredUserAvatar());
      setDisplayName(sessionStorage.getItem('auth_name')?.trim() || 'Member');
    };

    const loadCurrentUserProfile = async () => {
      const rawUserId = getStoredAuthValue('auth_user_id');
      if (!rawUserId) {
        syncAvatarFromStorage();
        return;
      }

      try {
        const user = await api.get<{ fullName: string; avatarUrl: string | null }>(`/users/${rawUserId}`);
        if (!active) return;

        setDisplayName(user.fullName || sessionStorage.getItem('auth_name')?.trim() || 'Member');
        setAvatarUrl(user.avatarUrl || null);
        try {
          if (user.avatarUrl) {
            setUserScopedLocalStorageItem(USER_AVATAR_STORAGE_KEY, user.avatarUrl);
          } else {
            removeUserScopedLocalStorageItem(USER_AVATAR_STORAGE_KEY);
          }
        } catch {
          // Ignore local storage write errors.
        }
      } catch {
        syncAvatarFromStorage();
      }
    };

    void loadCurrentUserProfile();

    window.addEventListener('focus', syncAvatarFromStorage);
    window.addEventListener('storage', syncAvatarFromStorage);
    window.addEventListener(USER_AVATAR_UPDATED_EVENT, syncAvatarFromStorage);
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, syncAvatarFromStorage);

    return () => {
      active = false;
      window.removeEventListener('focus', syncAvatarFromStorage);
      window.removeEventListener('storage', syncAvatarFromStorage);
      window.removeEventListener(USER_AVATAR_UPDATED_EVENT, syncAvatarFromStorage);
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, syncAvatarFromStorage);
    };
  }, []);

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const sessionId = getUserScopedLocalStorageItem('sessionId');
        if (sessionId) {
          const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: {
              'x-session-id': sessionId,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setCartCount(Array.isArray(data.data) ? data.data.length : 0);
            return;
          }
        }

        const storedCart = JSON.parse(getUserScopedLocalStorageItem('cart') || '[]');
        setCartCount(Array.isArray(storedCart) ? storedCart.length : 0);
      } catch {
        setCartCount(0);
      }
    };

    void updateCartCount();

    const handleCartUpdate = () => {
      void updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    setDarkModePreference(nextMode);
  };

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.to !== '/myring' || hasPurchasedRing),
    [hasPurchasedRing],
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-charcoal dark:text-white">
      <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/95 backdrop-blur dark:bg-charcoal/90">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-6 md:px-8">
          <div className="flex min-w-0 items-center gap-6 lg:gap-10">
            <Link to="/dashboard" className="flex shrink-0 items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[28px]">diamond</span>
              <span className="heading-serif text-2xl font-semibold tracking-tight">BondKeeper</span>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-medium text-slate-700 dark:text-slate-200 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'border-b pb-1 transition-colors',
                      isActive ? 'border-primary/40 text-slate-950 dark:text-white' : 'border-transparent hover:text-primary',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3 md:gap-5">
            <button
              type="button"
              aria-label="Notifications"
              className="text-slate-500 transition-colors hover:text-primary dark:text-slate-300"
            >
              <span className="material-symbols-outlined">notifications_none</span>
            </button>

            <button
              type="button"
              aria-label="Toggle theme"
              onClick={toggleDarkMode}
              className="text-slate-500 transition-colors hover:text-primary dark:text-slate-300"
            >
              <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>

            <Link to="/cart" className="relative text-slate-500 transition-colors hover:text-primary dark:text-slate-300">
              <span className="material-symbols-outlined">shopping_cart</span>
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            <div className="hidden h-8 w-px bg-primary/15 sm:block" />

            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-medium text-slate-800 dark:text-slate-100 md:inline">
                {displayName}
              </span>
              <Link to="/profile" aria-label="Profile">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/70 to-primary text-white shadow-md shadow-primary/15">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="user-shell-content">
        {children}
      </div>

      <style>{`
        .user-shell-content {
          min-height: calc(100vh - 5rem);
          background:
            radial-gradient(circle at top, rgba(236, 19, 128, 0.08), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .dark .user-shell-content {
          background:
            radial-gradient(circle at top, rgba(236, 19, 128, 0.16), transparent 28%),
            linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #e5e7eb;
        }

        .user-shell-content > header.sticky,
        .user-shell-content header.sticky.top-0.z-50.w-full,
        .user-shell-content .topbar {
          display: none !important;
        }

        .dark .user-shell-content > div,
        .dark .user-shell-content > main,
        .dark .user-shell-content > section {
          background-color: transparent;
        }

        .dark .user-shell-content .bg-background-light,
        .dark .user-shell-content .bg-cream,
        .dark .user-shell-content .bg-slate-50,
        .dark .user-shell-content .bg-white {
          background-color: #0f172a !important;
        }

        .dark .user-shell-content footer.bg-white,
        .dark .user-shell-content footer.bg-background-dark,
        .dark .user-shell-content footer.bg-charcoal {
          background-color: #111827 !important;
        }

        .dark .user-shell-content .bg-slate-50\\/50,
        .dark .user-shell-content .bg-slate-100,
        .dark .user-shell-content .bg-primary\\/5,
        .dark .user-shell-content .bg-white\\/70,
        .dark .user-shell-content .bg-white\\/80,
        .dark .user-shell-content .bg-white\\/95 {
          background-color: #1f2937 !important;
        }

        .dark .user-shell-content .border-slate-50,
        .dark .user-shell-content .border-slate-100,
        .dark .user-shell-content .border-slate-200,
        .dark .user-shell-content .border-primary\\/10,
        .dark .user-shell-content .border-primary\\/20 {
          border-color: #374151 !important;
        }

        .dark .user-shell-content .text-slate-900,
        .dark .user-shell-content .text-slate-800,
        .dark .user-shell-content .text-black,
        .dark .user-shell-content .dark\\:text-black {
          color: #f8fafc !important;
        }

        .dark .user-shell-content .text-slate-700,
        .dark .user-shell-content .text-slate-600,
        .dark .user-shell-content .text-slate-500,
        .dark .user-shell-content .text-slate-400,
        .dark .user-shell-content .text-charcoal\\/60,
        .dark .user-shell-content .dark\\:text-slate-500,
        .dark .user-shell-content .dark\\:text-black {
          color: #94a3b8 !important;
        }

        .dark .user-shell-content input,
        .dark .user-shell-content select,
        .dark .user-shell-content textarea {
          background-color: #111827;
          color: #f8fafc;
          border-color: #374151;
        }

        .user-shell-content .profile-page .wrap {
          padding-top: 48px;
        }
      `}</style>
    </div>
  );
}
