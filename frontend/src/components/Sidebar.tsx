import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Database,
  Heart,
  Settings,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {

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
    </aside>
  );
};

export default Sidebar;
