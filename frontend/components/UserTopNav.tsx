
import React, { useEffect, useState } from 'react';
import { AppView, ThemeType } from '../types';
import { api } from '../lib/api';

interface UserTopNavProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  onSignOut: () => void;
  theme: ThemeType;
  toggleTheme: () => void;
}

interface CurrentUserProfile {
  fullName: string;
  avatarUrl: string | null;
}

function getStoredAuthValue(key: string): string | null {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

const UserTopNav: React.FC<UserTopNavProps> = ({ currentView, setView, onSignOut, theme, toggleTheme }) => {
  const [profile, setProfile] = useState<CurrentUserProfile>({
    fullName: 'Member',
    avatarUrl: null,
  });

  useEffect(() => {
    const loadProfile = async () => {
      const rawUserId = getStoredAuthValue('auth_user_id');
      if (!rawUserId) return;

      try {
        const user = await api.get<{ fullName: string; avatarUrl: string | null }>(`/users/${rawUserId}`);
        setProfile({
          fullName: user.fullName || 'Member',
          avatarUrl: user.avatarUrl || null,
        });
      } catch (error) {
        console.error('Failed to load member profile:', error);
      }
    };

    loadProfile();
  }, []);

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard' },
    { id: AppView.COUPLE_SHOP, label: 'Couple Shop' },
    { id: AppView.RING_SCAN, label: 'Ring Scan' },
    { id: AppView.MY_RING, label: 'My Ring' },
    { id: AppView.COUPLE_PROFILE, label: 'Couple Profile' },
    { id: AppView.RELATIONSHIP, label: 'Relationship' },
  ];

  return (
    <nav className="h-20 bg-white/90 dark:bg-charcoal/80 backdrop-blur-md border-b border-rose-50 dark:border-slate-800 px-12 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary-red fill-1 text-3xl">favorite</span>
          <h1 className="text-xl font-serif font-bold italic tracking-tight">Eternal Rings</h1>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`text-xs font-bold transition-all relative py-2 ${
                currentView === item.id 
                ? 'text-primary-red' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {item.label}
              {currentView === item.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-red rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={() => setView(AppView.COUPLE_SHOP)}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-900/20 text-primary-red text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
          title="Open Couple Shop"
        >
          <span className="material-symbols-outlined text-sm">shopping_basket</span>
          Basket
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="size-10 flex items-center justify-center rounded-full bg-rose-50/50 dark:bg-slate-800 text-slate-400 hover:text-primary-red transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">
              {theme === ThemeType.LIGHT ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          <button className="size-10 flex items-center justify-center rounded-full bg-rose-50/50 dark:bg-slate-800 text-slate-400 relative">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-2 bg-primary-red rounded-full border-2 border-white dark:border-charcoal"></span>
          </button>
          <button onClick={onSignOut} className="size-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-md" title={profile.fullName}>
            <img src={profile.avatarUrl || 'https://picsum.photos/seed/user123/100'} alt="Avatar" className="w-full h-full object-cover" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default UserTopNav;
