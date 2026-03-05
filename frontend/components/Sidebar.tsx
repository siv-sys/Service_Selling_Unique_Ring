import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldAlert,
  Database,
  Settings,
  LogOut,
  Camera
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ADMIN_AVATAR_KEY = 'admin_profile_avatar';
const DEFAULT_ADMIN_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCmqQASMOLSpK9bGM0-CgmKl9sKhEN6GVoUAzpwuV_qazu6yD8oWPjCj2CgVE-fyl5QOGCpNgh0AALDLKkdOHjRa-3p55FWqeWN2IEP7WRWdYnm7HXTQcVmjLgTru9rytSOijqqbXBENwG2h6eS5rbKl-DJofpCy0tEpZyPfoMv5AsJPZDZqpkkANt9xz8DD1AV_Bn_rHCYdbeLal-7ErCbx9aXUtuDHNY3zLpAGd8hn2VbYSXD_hlpXuc3K9cKXLeY3qGkLCYJB5Sw';

const Sidebar = () => {
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_ADMIN_AVATAR);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedAvatar = localStorage.getItem(ADMIN_AVATAR_KEY);
    if (savedAvatar) {
      setAvatarSrc(savedAvatar);
    }
  }, []);

  const onAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      event.target.value = '';
      return;
    }

    const maxSizeInBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setAvatarSrc(result);
        localStorage.setItem(ADMIN_AVATAR_KEY, result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const resetAvatar = () => {
    setAvatarSrc(DEFAULT_ADMIN_AVATAR);
    localStorage.removeItem(ADMIN_AVATAR_KEY);
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'User & Pair Management', path: '/users' },
    { icon: Package, label: 'Ring Inventory', path: '/inventory' },
    { icon: ShieldAlert, label: 'Security Logs', path: '/security' },
    { icon: Database, label: 'Catalog Seed', path: '/catalog' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-primary/10 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-pink-500 to-rose-500 shadow-lg shadow-primary/25 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-white/90" />
          <div className="absolute w-3 h-3 rounded-full bg-white" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-900 border border-white/80" />
        </div>
        <div>
          <h1 className="text-[19px] font-black leading-tight tracking-[-0.02em] text-slate-900">BondKeeper</h1>
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-bold">Admin Console</p>
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
                ? 'bg-pink-200 text-pink-900 font-bold border-pink-300 shadow-sm'
                : 'text-slate-700 border-transparent hover:bg-pink-100 hover:text-pink-900 hover:border-pink-200 active:bg-pink-200 active:text-pink-900'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-2 mt-2 border-t border-primary/5">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300',
              isActive
                ? 'bg-pink-200 text-pink-900 font-bold border-pink-300 shadow-sm'
                : 'text-slate-700 border-transparent hover:bg-pink-100 hover:text-pink-900 hover:border-pink-200 active:bg-pink-200 active:text-pink-900'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="px-4 pb-6 pt-4 border-t border-primary/5">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary hover:bg-primary/5 transition-colors mb-4 font-semibold">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>

        <div className="px-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAvatarClick}
              className="relative rounded-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Upload admin profile picture"
            >
              <img
                alt="Admin profile"
                className="w-12 h-12 rounded-full border-2 border-primary/20 shadow-sm object-cover"
                src={avatarSrc}
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                <Camera className="w-3 h-3" />
              </span>
            </button>

            <div className="overflow-hidden text-left">
              <p className="text-sm font-bold truncate">Alex Rivera</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
