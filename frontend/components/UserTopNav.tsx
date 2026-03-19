
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
    { id: AppView.MY_RING, label: 'My Ring' },
    { id: AppView.COUPLE_PROFILE, label: 'Couple Profile' },
  ];

  return (
    <nav className="h-[72px] bg-white border-b border-[#ece7ed] px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#f542a7] text-[21px]">diamond</span>
          <h1 className="text-[36px] leading-none font-serif font-semibold text-[#f542a7]">BondKeeper</h1>
        </div>
        
        <div className="hidden lg:flex items-center gap-10">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`text-[24px] transition-colors ${
                currentView === item.id 
                ? 'text-[#f542a7] font-semibold' 
                : 'text-[#27272a] hover:text-[#f542a7]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-5 md:gap-6">
        <button className="hidden sm:flex text-[#27272a] hover:text-[#27272a] transition-colors" title="Notifications">
          <span className="material-symbols-outlined text-[25px] leading-none">notifications_none</span>
        </button>
        <button 
          onClick={toggleTheme}
          className="hidden sm:flex text-[#27272a] hover:text-[#27272a] transition-colors"
          title={theme === ThemeType.LIGHT ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <span className="material-symbols-outlined text-[25px] leading-none">
            {theme === ThemeType.LIGHT ? 'bedtime' : 'light_mode'}
          </span>
        </button>
        <button
          onClick={() => setView(AppView.COUPLE_SHOP)}
          className="hidden sm:flex text-[#27272a] hover:text-[#27272a] transition-colors"
          title="Couple Shop"
        >
          <span className="material-symbols-outlined text-[25px] leading-none">shopping_cart</span>
        </button>

        <div className="h-8 w-px bg-[#e7e4ea] hidden sm:block"></div>

        <button onClick={onSignOut} className="flex items-center gap-3" title={profile.fullName}>
          <span className="hidden md:inline text-[22px] text-[#27272a] font-normal">{profile.fullName}</span>
          <div className="size-10 rounded-full overflow-hidden border border-[#efedf1] shadow-sm">
            <img src={profile.avatarUrl || 'https://picsum.photos/seed/user123/100'} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </button>
      </div>
    </nav>
  );
};

export default UserTopNav;
