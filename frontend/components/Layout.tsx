import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      <style>{`
        .dark main.bg-slate-50,
        .dark main.bg-slate-50\\/50,
        .dark .bg-white {
          background-color: #111827;
        }

        .dark .border-slate-200,
        .dark .border-slate-300,
        .dark .border-pink-200,
        .dark .border-pink-300 {
          border-color: #374151 !important;
        }

        .dark .text-slate-900,
        .dark .text-slate-800 {
          color: #f3f4f6 !important;
        }

        .dark .text-slate-700,
        .dark .text-slate-600,
        .dark .text-slate-500,
        .dark .text-slate-400 {
          color: #94a3b8 !important;
        }
      `}</style>
    </div>
  );
};

export default Layout;
