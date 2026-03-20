
import React, { useEffect, useState } from 'react';
import { AppView, ThemeType, Role } from '../types';
import { api } from '../lib/api';

interface HeaderProps {
  view: AppView;
  theme: ThemeType;
  toggleTheme: () => void;
  role: Role;
  setView: (view: AppView) => void;
}

interface CurrentUserProfile {
  fullName: string;
  avatarUrl: string | null;
}

interface StoredSettingsProfile {
  fullName?: string;
  avatarUrl?: string;
}

function getStoredAuthValue(key: string): string | null {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function getStoredSettingsProfile(): StoredSettingsProfile {
  const raw = localStorage.getItem('settings_view_v1');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StoredSettingsProfile;
    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : undefined,
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : undefined,
    };
  } catch {
    return {};
  }
}

const Header: React.FC<HeaderProps> = ({ view, theme, toggleTheme, role, setView }) => {
  const isAdmin = role === Role.ADMIN;
  const storedProfile = getStoredSettingsProfile();
  const [profile, setProfile] = useState<CurrentUserProfile>({
    fullName: role === Role.ADMIN ? storedProfile.fullName || 'Admin' : 'Member',
    avatarUrl: role === Role.ADMIN ? storedProfile.avatarUrl || null : null,
  });

  useEffect(() => {
    const loadProfile = async () => {
      const localProfile = getStoredSettingsProfile();
      if (isAdmin && (localProfile.fullName || localProfile.avatarUrl)) {
        setProfile((previous) => ({
          fullName: localProfile.fullName || previous.fullName,
          avatarUrl: localProfile.avatarUrl || previous.avatarUrl,
        }));
      }

      const rawUserId = getStoredAuthValue('auth_user_id');
      if (!rawUserId) return;

      try {
        const user = await api.get<{ fullName: string; avatarUrl: string | null }>(`/users/${rawUserId}`);
        const stored = getStoredSettingsProfile();
        setProfile({
          fullName:
            (isAdmin ? stored.fullName : '') ||
            user.fullName ||
            (role === Role.ADMIN ? 'Admin' : 'Member'),
          avatarUrl: (isAdmin ? stored.avatarUrl : '') || user.avatarUrl || null,
        });
      } catch (error) {
        console.error('Failed to load header profile:', error);
      }
    };

    loadProfile();

    const syncStoredProfile = () => {
      if (!isAdmin) return;
      const localProfile = getStoredSettingsProfile();
      setProfile((previous) => ({
        fullName: localProfile.fullName || previous.fullName,
        avatarUrl: localProfile.avatarUrl || previous.avatarUrl,
      }));
    };

    window.addEventListener('admin-profile-updated', syncStoredProfile);
    window.addEventListener('storage', syncStoredProfile);

    return () => {
      window.removeEventListener('admin-profile-updated', syncStoredProfile);
      window.removeEventListener('storage', syncStoredProfile);
    };
  }, [isAdmin, role]);

  const getTitle = () => {
    switch (view) {
      case AppView.DASHBOARD: return 'Command Center';
      case AppView.USER_MGMT: return 'User & Pair Registry';
      case AppView.INVENTORY: return 'Ring Inventory';
      case AppView.SECURITY_LOGS: return 'Security Logs';
      case AppView.ADMIN_SEED: return 'Catalog Seed';
      case AppView.SETTINGS: return 'System Settings';
      case AppView.RELATIONSHIP: return 'Relationship Certificate';
      case AppView.COUPLE_PROFILE: return 'Eternal Connection';
      default: return 'BondKeeper';
    }
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 md:px-10 bg-white dark:bg-charcoal border-b border-rose-50 dark:border-slate-800 z-10 shrink-0">
      <div className="flex flex-col">
        <h2 className="text-xl font-extrabold tracking-tight">{getTitle()}</h2>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>Home</span>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-primary-red dark:text-rose-400 font-bold capitalize">
            {view.replace('_', ' ').toLowerCase()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input 
            className="h-10 w-64 rounded-xl border-none bg-rose-50/50 dark:bg-slate-800 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-rose-500 transition-all" 
            placeholder="Quick search..." 
            type="text" 
          />
        </div>

        <button 
          onClick={toggleTheme}
          className="size-10 flex items-center justify-center rounded-xl bg-rose-50/50 dark:bg-slate-800 hover:text-primary-red transition-colors"
        >
          <span className="material-symbols-outlined">
            {theme === ThemeType.LIGHT ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        <button className="relative size-10 flex items-center justify-center rounded-xl bg-rose-50/50 dark:bg-slate-800 hover:text-primary-red transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2.5 right-2.5 size-2 bg-primary-red rounded-full border-2 border-white dark:border-charcoal"></span>
        </button>

        <div className="h-8 w-px bg-rose-100 dark:bg-slate-800 mx-2 hidden md:block"></div>

        <button 
          onClick={() => setView(AppView.SETTINGS)}
          className="hidden sm:flex items-center gap-3 px-1 rounded-xl hover:bg-rose-50/50 dark:hover:bg-slate-800 transition-all"
        >
          <div className="size-9 rounded-full overflow-hidden border-2 border-white dark:border-slate-700">
            <img src={profile.avatarUrl || 'https://picsum.photos/seed/user/100'} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-xs font-bold leading-none">{profile.fullName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {role === Role.ADMIN ? 'Admin' : 'Member'}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
