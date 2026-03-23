import React, { useEffect, useRef, useState } from 'react';
import { Bell, Download } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  showExportButton?: boolean;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  notifications?: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
  }>;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  showExportButton = false,
  onExportExcel,
  onExportPdf,
  notifications = []
}) => {
  const defaultProfilePhoto =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCmqQASMOLSpK9bGM0-CgmKl9sKhEN6GVoUAzpwuV_qazu6yD8oWPjCj2CgVE-fyl5QOGCpNgh0AALDLKkdOHjRa-3p55FWqeWN2IEP7WRWdYnm7HXTQcVmjLgTru9rytSOijqqbXBENwG2h6eS5rbKl-DJofpCy0tEpZyPfoMv5AsJPZDZqpkkANt9xz8DD1AV_Bn_rHCYdbeLal-7ErCbx9aXUtuDHNY3zLpAGd8hn2VbYSXD_hlpXuc3K9cKXLeY3qGkLCYJB5Sw';
  const [profilePhoto, setProfilePhoto] = useState(defaultProfilePhoto);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('admin_profile_photo');
    if (saved) setProfilePhoto(saved);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (exportRef.current && !exportRef.current.contains(target)) {
        setIsExportOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
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
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            className="relative rounded-full border border-pink-200 p-2 text-pink-700 transition-colors hover:bg-pink-100 active:bg-pink-200 active:text-pink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 dark:border-slate-700 dark:text-pink-300 dark:hover:bg-slate-800"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-pink-600 rounded-full"></span>}
          </button>
          {isNotificationOpen && (
            <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-pink-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-pink-100 px-4 py-3 text-sm font-bold text-pink-900 dark:border-slate-800 dark:text-pink-300">
                Notifications
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">No notifications</p>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className="border-b border-pink-50 px-4 py-3 last:border-b-0 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{item.description}</p>
                      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{item.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
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
          className="rounded-full border-2 border-pink-300 p-0.5 hover:border-pink-400 active:border-pink-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
          title="Admin profile"
        >
          <img
            src={profilePhoto}
            alt="Admin profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};

export default Header;
