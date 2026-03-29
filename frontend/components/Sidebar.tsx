import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api, resolveApiAssetUrl } from '../lib/api';
import {
  getStoredAuthValue,
  getUserScopedLocalStorageItem,
  setUserScopedLocalStorageItem,
} from '../lib/userStorage';
import {
  LayoutDashboard,
  Users,
  Package,
  Database,
  Heart,
  Settings,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PROFILE_AVATAR_STORAGE_KEY = 'bondkeeper_user_avatar_url';
const USER_AVATAR_UPDATED_EVENT = 'bondkeeper:user-avatar-updated';
const USER_PROFILE_UPDATED_EVENT = 'bondkeeper:user-profile-updated';
const DEFAULT_PROFILE_NAME = 'Admin';

interface SidebarProps {
  onLogout?: () => void;
}

const Sidebar = ({ onLogout }: SidebarProps) => {
  const defaultProfilePhoto =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCmqQASMOLSpK9bGM0-CgmKl9sKhEN6GVoUAzpwuV_qazu6yD8oWPjCj2CgVE-fyl5QOGCpNgh0AALDLKkdOHjRa-3p55FWqeWN2IEP7WRWdYnm7HXTQcVmjLgTru9rytSOijqqbXBENwG2h6eS5rbKl-DJofpCy0tEpZyPfoMv5AsJPZDZqpkkANt9xz8DD1AV_Bn_rHCYdbeLal-7ErCbx9aXUtuDHNY3zLpAGd8hn2VbYSXD_hlpXuc3K9cKXLeY3qGkLCYJB5Sw';
  const [profilePhoto, setProfilePhoto] = useState(defaultProfilePhoto);
  const [profileName, setProfileName] = useState('Admin');
  const [roleLabel, setRoleLabel] = useState('System Admin');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncAdminProfile = useCallback(async () => {
    const authRole = String(getStoredAuthValue('auth_roles') || '').toLowerCase();
    setRoleLabel(authRole === 'admin' ? 'System Admin' : 'Member');
    const storedName = sessionStorage.getItem('auth_name')?.trim() || DEFAULT_PROFILE_NAME;
    const storedAvatar = getUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY) || '';
    const fallbackPhoto = resolveApiAssetUrl(storedAvatar) || defaultProfilePhoto;
    setProfileName(storedName);
    setProfilePhoto(fallbackPhoto);

    const rawUserId = getStoredAuthValue('auth_user_id');
    if (!rawUserId) return;

    try {
      const user = await api.get<{ fullName?: string; avatarUrl?: string | null }>(`/users/${rawUserId}`);
      setProfileName(sessionStorage.getItem('auth_name')?.trim() || user.fullName || DEFAULT_PROFILE_NAME);
      setProfilePhoto(resolveApiAssetUrl(storedAvatar || user.avatarUrl || '') || defaultProfilePhoto);
    } catch {
      // Keep fallback display values when profile query is unavailable.
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

  const openPhotoPicker = () => fileInputRef.current?.click();

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const rawUserId = getStoredAuthValue('auth_user_id');
        if (rawUserId) {
          try {
            const updated = await api.patch<{ avatarUrl: string }>(`/users/${rawUserId}/avatar`, { avatarUrl: reader.result });
            const resolvedAvatar = resolveApiAssetUrl(updated.avatarUrl);
            setProfilePhoto(resolvedAvatar);
            setUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY, updated.avatarUrl || reader.result);
            window.dispatchEvent(new Event(USER_AVATAR_UPDATED_EVENT));
            return;
          } catch {
            // Fallback to local-only save if backend sync fails.
          }
        }

        setProfilePhoto(reader.result);
        setUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY, reader.result);
        window.dispatchEvent(new Event(USER_AVATAR_UPDATED_EVENT));
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admindashboard' },
    { icon: Users, label: 'User & Pair Management', path: '/users' },
    { icon: Package, label: 'Ring Inventory', path: '/inventory' },
    { icon: Database, label: 'Catalog Seed', path: '/catalog' },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r-2 border-pink-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-pink-200 p-6 dark:border-slate-800">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-lg font-black leading-tight tracking-tight text-pink-700 dark:text-pink-300">RingAdmin</h1>
          <p className="text-[11px] font-bold uppercase tracking-wider text-pink-500 dark:text-pink-400">Console</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300',
              isActive
                ? 'bg-pink-200 text-pink-900 font-bold border-pink-300 dark:bg-pink-500/20 dark:border-pink-400/40 dark:text-pink-200'
                : 'text-slate-700 border-transparent hover:bg-pink-100 hover:text-pink-900 hover:border-pink-200 active:bg-pink-200 active:text-pink-900 dark:text-slate-300 dark:hover:bg-pink-500/10 dark:hover:text-pink-200 dark:hover:border-pink-400/30'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-2 mt-2 border-t border-pink-200 dark:border-slate-800">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300',
              isActive
                ? 'bg-pink-200 text-pink-900 font-bold border-pink-300 dark:bg-pink-500/20 dark:border-pink-400/40 dark:text-pink-200'
                : 'text-slate-700 border-transparent hover:bg-pink-100 hover:text-pink-900 hover:border-pink-200 active:bg-pink-200 active:text-pink-900 dark:text-slate-300 dark:hover:bg-pink-500/10 dark:hover:text-pink-200 dark:hover:border-pink-400/30'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="border-t border-pink-200 bg-pink-50/20 px-4 pb-6 pt-4 dark:border-slate-800 dark:bg-slate-950/80">
        <button
          type="button"
          onClick={onLogout}
          className="mb-4 flex w-full items-center gap-3 rounded-xl border border-pink-300 px-4 py-3 font-semibold text-pink-900 transition-colors active:scale-[0.99] hover:bg-pink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 dark:border-pink-400/40 dark:text-pink-200 dark:hover:bg-pink-500/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>

        <button
          type="button"
          onClick={openPhotoPicker}
          className="flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-pink-200 hover:bg-pink-100 dark:hover:border-pink-400/30 dark:hover:bg-pink-500/10"
          title="Click to upload profile photo"
        >
          <img
            alt={profileName}
            className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-sm object-cover"
            src={profilePhoto}
          />
          <div className="overflow-hidden text-left">
            <p className="truncate text-sm font-bold dark:text-slate-100">{profileName}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>
    </aside>
  );
};

export default Sidebar;
