import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { isStoredDarkModeEnabled, setDarkModePreference } from '../lib/theme';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const COUPLE_PROFILE_STORAGE_KEY = 'bondkeeper_profile_persist_v1';

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

function readStoredCoupleName() {
  try {
    const raw = localStorage.getItem(COUPLE_PROFILE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { title?: unknown } | null;
    return typeof parsed?.title === 'string' && parsed.title.trim() ? parsed.title.trim() : null;
  } catch {
    return null;
  }
}

export default function UserShell({ children }: PropsWithChildren) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [displayName, setDisplayName] = useState('Alex & Jamie');

  useEffect(() => {
    const savedDarkMode = isStoredDarkModeEnabled();
    setIsDarkMode(savedDarkMode);

    const storedCoupleName = readStoredCoupleName();
    const authName = sessionStorage.getItem('auth_name')?.trim();
    setDisplayName(storedCoupleName || authName || 'Alex & Jamie');
  }, []);

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
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

        const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
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

  const navItems = useMemo(() => NAV_ITEMS, []);

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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary text-white shadow-md shadow-primary/15">
                  <span className="material-symbols-outlined text-[20px]">favorite</span>
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
