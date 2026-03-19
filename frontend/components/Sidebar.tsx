import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
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

interface SidebarProps {
  onLogout?: () => void;
}

const Sidebar = ({ onLogout }: SidebarProps) => {
  const defaultProfilePhoto =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCmqQASMOLSpK9bGM0-CgmKl9sKhEN6GVoUAzpwuV_qazu6yD8oWPjCj2CgVE-fyl5QOGCpNgh0AALDLKkdOHjRa-3p55FWqeWN2IEP7WRWdYnm7HXTQcVmjLgTru9rytSOijqqbXBENwG2h6eS5rbKl-DJofpCy0tEpZyPfoMv5AsJPZDZqpkkANt9xz8DD1AV_Bn_rHCYdbeLal-7ErCbx9aXUtuDHNY3zLpAGd8hn2VbYSXD_hlpXuc3K9cKXLeY3qGkLCYJB5Sw';
  const [profilePhoto, setProfilePhoto] = useState(defaultProfilePhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('admin_profile_photo');
    if (saved) setProfilePhoto(saved);
  }, []);

  const openPhotoPicker = () => fileInputRef.current?.click();

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePhoto(reader.result);
        localStorage.setItem('admin_profile_photo', reader.result);
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
    <aside className="w-64 bg-white border-r-2 border-pink-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-pink-200">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Heart className="w-6 h-6 fill-current" />
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
              'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300',
              isActive
                ? 'bg-pink-200 text-pink-900 font-bold border-pink-300'
                : 'text-slate-700 border-transparent hover:bg-pink-100 hover:text-pink-900 hover:border-pink-200 active:bg-pink-200 active:text-pink-900'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-2 mt-2 border-t border-pink-200">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300',
              isActive
                ? 'bg-pink-200 text-pink-900 font-bold border-pink-300'
                : 'text-slate-700 border-transparent hover:bg-pink-100 hover:text-pink-900 hover:border-pink-200 active:bg-pink-200 active:text-pink-900'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="px-4 pb-6 pt-4 border-t border-pink-200 bg-pink-50/20">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-pink-300 text-pink-900 hover:bg-pink-100 active:bg-pink-200 active:scale-[0.99] transition-colors mb-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>

        <button
          type="button"
          onClick={openPhotoPicker}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg border border-transparent hover:bg-pink-100 hover:border-pink-200 transition-colors text-left"
          title="Click to upload profile photo"
        >
          <img
            alt="Alex Rivera"
            className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-sm object-cover"
            src={profilePhoto}
          />
          <div className="overflow-hidden text-left">
            <p className="text-sm font-bold truncate">Alex Rivera</p>
            <p className="text-xs text-slate-500 truncate">System Admin</p>
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
