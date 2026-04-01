import React, { useEffect, useState } from 'react';
import { AppView, ThemeType } from '../types';
import { api, resolveApiAssetUrl } from '../lib/api';
import {
  getStoredAuthValue,
  getUserScopedLocalStorageItem,
  removeUserScopedLocalStorageItem,
  setUserScopedLocalStorageItem,
} from '../lib/userStorage';

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

const PROFILE_AVATAR_STORAGE_KEY = 'bondkeeper_user_avatar_url';
const USER_AVATAR_UPDATED_EVENT = 'bondkeeper:user-avatar-updated';
const USER_PROFILE_UPDATED_EVENT = 'bondkeeper:user-profile-updated';
const DEFAULT_PROFILE_NAME = 'Member';
const DEFAULT_SUPPORT_EMAIL = 'support@bondkeeper.com';

function readStoredAvatar() {
  return getUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY);
}

const UserTopNav: React.FC<UserTopNavProps> = ({ currentView, setView, onSignOut, theme, toggleTheme }) => {
  const [profile, setProfile] = useState<CurrentUserProfile>({
    fullName: DEFAULT_PROFILE_NAME,
    avatarUrl: readStoredAvatar(),
  });
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SUPPORT_EMAIL);

  useEffect(() => {
    let active = true;

    const syncProfile = async () => {
      const storedAvatar = readStoredAvatar();
      const storedName = sessionStorage.getItem('auth_name')?.trim() || DEFAULT_PROFILE_NAME;
      setProfile((current) => ({
        ...current,
        fullName: storedName,
        avatarUrl: storedAvatar || current.avatarUrl,
      }));

      const rawUserId = getStoredAuthValue('auth_user_id');
      if (!rawUserId) return;

      try {
        const user = await api.get<{ fullName: string; avatarUrl: string | null }>(`/users/${rawUserId}`);
        if (!active) return;

        const nextAvatarUrl = user.avatarUrl || storedAvatar || null;
        setProfile({
          fullName: user.fullName || storedName || DEFAULT_PROFILE_NAME,
          avatarUrl: nextAvatarUrl,
        });

        try {
          if (user.avatarUrl) {
            setUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY, user.avatarUrl);
          } else if (!storedAvatar) {
            removeUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY);
          }
        } catch {
          // Ignore local storage write errors.
        }
      } catch (error) {
        console.error('Failed to load member profile:', error);
      }
    };

    void syncProfile();

    const syncSupportEmail = async () => {
      try {
        const data = await api.get<{ settings?: { support_email?: string } }>('/settings/system');
        const nextEmail = data?.settings?.support_email;
        if (typeof nextEmail === 'string' && nextEmail.trim()) {
          setSupportEmail(nextEmail.trim());
        }
      } catch {
        setSupportEmail(DEFAULT_SUPPORT_EMAIL);
      }
    };

    void syncSupportEmail();

    window.addEventListener('focus', syncProfile);
    window.addEventListener('storage', syncProfile);
    window.addEventListener(USER_AVATAR_UPDATED_EVENT, syncProfile);
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, syncProfile);

    return () => {
      active = false;
      window.removeEventListener('focus', syncProfile);
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener(USER_AVATAR_UPDATED_EVENT, syncProfile);
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, syncProfile);
    };
  }, []);

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard' },
    { id: AppView.COUPLE_SHOP, label: 'Couple Shop' },
    { id: AppView.MY_RING, label: 'My Ring' },
    { id: AppView.COUPLE_PROFILE, label: 'Couple Profile' },
  ];

  const handleMessageAdmin = () => {
    const subject = encodeURIComponent('Receipt verification request');
    const body = encodeURIComponent(
      `Hello Admin,\n\nI have uploaded my payment receipt and would like to request verification for my ring purchase.\n\nName: ${profile.fullName}\n\nPlease let me know if you need any additional details.\n`,
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

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
        <button
          className="hidden sm:flex text-[#27272a] hover:text-[#27272a] transition-colors"
          title="Message admin"
          onClick={handleMessageAdmin}
        >
          <span className="material-symbols-outlined text-[25px] leading-none">chat_bubble</span>
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
            {profile.avatarUrl ? (
              <img src={resolveApiAssetUrl(profile.avatarUrl)} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white">
                <span className="material-symbols-outlined text-[18px]">favorite</span>
              </span>
            )}
          </div>
        </button>
      </div>
    </nav>
  );
};

export default UserTopNav;
