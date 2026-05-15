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
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-200 p-6 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-950 dark:text-slate-100">RingAdmin</h1>
          <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Console</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              isActive
                ? 'border-primary/20 bg-primary/10 font-bold text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-pink-200'
                : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-800">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              isActive
                ? 'border-primary/20 bg-primary/10 font-bold text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-pink-200'
                : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100'
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
