import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldAlert,
  Database,
  Settings,
  LogOut,
  Heart
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {
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
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight text-primary">SmartRing</h1>
          <p className="text-xs text-slate-500">Admin Console</p>
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
          <img
            alt="Alex Rivera"
            className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-sm object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmqQASMOLSpK9bGM0-CgmKl9sKhEN6GVoUAzpwuV_qazu6yD8oWPjCj2CgVE-fyl5QOGCpNgh0AALDLKkdOHjRa-3p55FWqeWN2IEP7WRWdYnm7HXTQcVmjLgTru9rytSOijqqbXBENwG2h6eS5rbKl-DJofpCy0tEpZyPfoMv5AsJPZDZqpkkANt9xz8DD1AV_Bn_rHCYdbeLal-7ErCbx9aXUtuDHNY3zLpAGd8hn2VbYSXD_hlpXuc3K9cKXLeY3qGkLCYJB5Sw"
          />
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
