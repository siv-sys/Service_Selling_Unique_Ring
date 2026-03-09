import React, { useEffect, useRef, useState } from 'react';
import { Bell, Search, Plus, Download } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  showProvisionButton?: boolean;
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
  showProvisionButton = false,
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
    <header className="h-20 bg-white border-b-2 border-pink-300 flex items-center justify-between px-8 z-10 sticky top-0">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 bg-pink-50 border border-pink-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-300 w-64"
          />
        </div>
        
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            className="p-2 text-pink-700 hover:bg-pink-100 active:bg-pink-200 active:text-pink-900 rounded-full relative transition-colors border border-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-pink-600 rounded-full"></span>}
          </button>
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-pink-200 rounded-xl shadow-lg z-30 overflow-hidden">
              <div className="px-4 py-3 border-b border-pink-100 text-sm font-bold text-pink-900">
                Notifications
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-500">No notifications</p>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className="px-4 py-3 border-b border-pink-50 last:border-b-0">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-600">{item.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{item.time}</p>
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
              className="bg-white border border-pink-300 text-pink-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-pink-100 active:bg-pink-200 active:text-pink-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-pink-200 rounded-xl shadow-lg z-30 p-2">
                <button
                  type="button"
                  onClick={() => {
                    onExportExcel?.();
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-pink-100 rounded-lg"
                >
                  Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportPdf?.();
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-pink-100 rounded-lg"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>
        )}
        
        {showProvisionButton && (
          <button className="bg-pink-700 hover:bg-pink-800 active:bg-pink-900 active:scale-[0.99] text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-pink-300/30 border border-pink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">
            <Plus className="w-4 h-4" />
            Provision New Device
          </button>
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
