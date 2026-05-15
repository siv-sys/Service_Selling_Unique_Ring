import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { api, resolveApiAssetUrl } from '../lib/api';
import { getStoredAuthValue, getUserScopedLocalStorageItem } from '../lib/userStorage';

const PROFILE_AVATAR_STORAGE_KEY = 'bondkeeper_user_avatar_url';
const USER_AVATAR_UPDATED_EVENT = 'bondkeeper:user-avatar-updated';
const USER_PROFILE_UPDATED_EVENT = 'bondkeeper:user-profile-updated';
const DEFAULT_PROFILE_NAME = 'Admin';

interface HeaderProps {
  title: string;
  subtitle: string;
  showExportButton?: boolean;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  showExportButton = false,
  onExportExcel,
  onExportPdf,
}) => {
  const navigate = useNavigate();
  const defaultProfilePhoto =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCmqQASMOLSpK9bGM0-CgmKl9sKhEN6GVoUAzpwuV_qazu6yD8oWPjCj2CgVE-fyl5QOGCpNgh0AALDLKkdOHjRa-3p55FWqeWN2IEP7WRWdYnm7HXTQcVmjLgTru9rytSOijqqbXBENwG2h6eS5rbKl-DJofpCy0tEpZyPfoMv5AsJPZDZqpkkANt9xz8DD1AV_Bn_rHCYdbeLal-7ErCbx9aXUtuDHNY3zLpAGd8hn2VbYSXD_hlpXuc3K9cKXLeY3qGkLCYJB5Sw';
  const [profilePhoto, setProfilePhoto] = useState(defaultProfilePhoto);
  const [profileName, setProfileName] = useState(DEFAULT_PROFILE_NAME);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const syncAdminProfile = useCallback(async () => {
    const storedName = sessionStorage.getItem('auth_name')?.trim() || DEFAULT_PROFILE_NAME;
    const storedAvatar = getUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY) || '';
    const fallbackPhoto = resolveApiAssetUrl(storedAvatar) || defaultProfilePhoto;

    setProfileName(storedName);
    setProfilePhoto(fallbackPhoto);

    const rawUserId = getStoredAuthValue('auth_user_id');
    if (!rawUserId) {
      return;
    }

    try {
      const user = await api.get<{ fullName?: string; avatarUrl?: string | null }>(`/users/${rawUserId}`);
      const nextPhoto = resolveApiAssetUrl(storedAvatar || user.avatarUrl || '') || defaultProfilePhoto;
      setProfileName(sessionStorage.getItem('auth_name')?.trim() || user.fullName || DEFAULT_PROFILE_NAME);
      setProfilePhoto(nextPhoto);
    } catch {
      // Keep the stored profile identity when the backend profile request is unavailable.
    }
  }, [defaultProfilePhoto]);

  useEffect(() => {
    void syncAdminProfile();

    const handleProfileSync = () => {
      void syncAdminProfile();
    };

    window.addEventListener(USER_AVATAR_UPDATED_EVENT, handleProfileSync);
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileSync);
    window.addEventListener('focus', handleProfileSync);

    return () => {
      window.removeEventListener(USER_AVATAR_UPDATED_EVENT, handleProfileSync);
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileSync);
      window.removeEventListener('focus', handleProfileSync);
    };
  }, [syncAdminProfile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (exportRef.current && !exportRef.current.contains(target)) {
        setIsExportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b-2 border-pink-300 bg-white px-8 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-4">
        {showExportButton && (
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setIsExportOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-pink-300 bg-white px-4 py-2 text-sm font-bold text-pink-800 transition-all hover:bg-pink-100 active:bg-pink-200 active:text-pink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 dark:border-slate-700 dark:bg-slate-900 dark:text-pink-300 dark:hover:bg-slate-800"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {isExportOpen && (
              <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-pink-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    onExportExcel?.();
                    setIsExportOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-pink-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportPdf?.();
                    setIsExportOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-pink-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>
        )}
        
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="rounded-full border-2 border-pink-300 p-0.5 hover:border-pink-400 active:border-pink-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
          title="Open admin profile settings"
          aria-label="Open admin profile settings"
        >
          <img
            src={profilePhoto}
            alt={profileName}
            className="w-10 h-10 rounded-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};

export default Header;
