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

        .dark .border-slate-100,
        .dark .border-slate-200,
        .dark .border-slate-300,
        .dark .border-pink-200,
        .dark .border-pink-300 {
          border-color: #475569 !important;
        }

        .dark .text-slate-950,
        .dark .text-slate-900,
        .dark .text-slate-800,
        .dark .text-gray-900,
        .dark .text-gray-800,
        .dark .text-black {
          color: #f8fafc !important;
        }

        .dark .text-slate-300,
        .dark .text-slate-700,
        .dark .text-slate-600,
        .dark .text-slate-500,
        .dark .text-slate-400,
        .dark .text-gray-700,
        .dark .text-gray-600,
        .dark .text-gray-500,
        .dark .text-gray-400 {
          color: #cbd5e1 !important;
        }

        .dark h1,
        .dark h2,
        .dark h3,
        .dark h4,
        .dark strong,
        .dark label {
          color: #f8fafc;
        }

        .dark input,
        .dark select,
        .dark textarea {
          color: #f8fafc;
          border-color: #64748b;
        }

        .dark ::placeholder {
          color: #94a3b8;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Layout;
