import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldAlert,
  Database,
  Settings,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {
  const DEFAULT_ADMIN_AVATAR =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCmqQASMOLSpK9bGM0-CgmKl9sKhEN6GVoUAzpwuV_qazu6yD8oWPjCj2CgVE-fyl5QOGCpNgh0AALDLKkdOHjRa-3p55FWqeWN2IEP7WRWdYnm7HXTQcVmjLgTru9rytSOijqqbXBENwG2h6eS5rbKl-DJofpCy0tEpZyPfoMv5AsJPZDZqpkkANt9xz8DD1AV_Bn_rHCYdbeLal-7ErCbx9aXUtuDHNY3zLpAGd8hn2VbYSXD_hlpXuc3K9cKXLeY3qGkLCYJB5Sw';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [adminAvatar, setAdminAvatar] = useState(DEFAULT_ADMIN_AVATAR);

  useEffect(() => {
    return () => {
      if (adminAvatar.startsWith('blob:')) {
        URL.revokeObjectURL(adminAvatar);
      }
    };
  }, [adminAvatar]);

  const handleOpenAvatarPicker = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Please select an image file.');
      event.target.value = '';
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setAdminAvatar(nextUrl);
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
      <div className="p-6 flex items-center gap-3 border-b border-slate-200">
        <div className="relative w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-pink-700 text-white shadow-lg shadow-pink-500/30">
          <span className="absolute w-6 h-6 rounded-full border-[2.5px] border-white/95" />
          <span className="absolute w-3 h-3 rounded-full border-2 border-white/90" />
          <span className="absolute top-1.5 w-2.5 h-2.5 rotate-45 rounded-[3px] bg-white/95 shadow-sm" />
        </div>
        <div>
          <h1 className="text-lg font-black leading-tight tracking-tight text-pink-700">RingAdmin</h1>
          <p className="text-[11px] font-bold uppercase tracking-wider text-pink-500">Console</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-slate-600 hover:bg-primary/5'
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
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-slate-600 hover:bg-primary/5'
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

        <div className="flex items-center gap-3 px-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            onClick={handleOpenAvatarPicker}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
            title="Upload admin profile photo"
          >
            <img
              alt="Alex Rivera"
              className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-sm object-cover"
              src={adminAvatar}
            />
          </button>
          <div className="overflow-hidden text-left">
            <p className="text-sm font-bold truncate">Alex Rivera</p>
            <p className="text-xs text-slate-500 truncate">System Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
