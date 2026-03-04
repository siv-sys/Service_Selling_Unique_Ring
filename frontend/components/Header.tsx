import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Search, Plus, Download } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  showProvisionButton?: boolean;
  showExportButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  showProvisionButton = false,
  showExportButton = false
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    type: 'system' | 'ring';
    title: string;
    message: string;
    time: string;
    read: boolean;
  }>>([]);
  const [ringModel, setRingModel] = useState('');
  const [ringSerial, setRingSerial] = useState('');
  const [ringStatus, setRingStatus] = useState('In Stock');

  useEffect(() => {
    const cached = localStorage.getItem('admin_ring_notifications');
    if (cached) {
      setNotifications(JSON.parse(cached));
      return;
    }

    setNotifications([
      {
        id: Date.now(),
        type: 'system',
        title: 'Welcome',
        message: 'Notification center is ready to store ring information.',
        time: new Date().toLocaleString(),
        read: false
      }
    ]);
  }, []);

  useEffect(() => {
    if (notifications.length === 0) return;
    localStorage.setItem('admin_ring_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const addRingNotification = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ringModel.trim() || !ringSerial.trim()) return;

    const item = {
      id: Date.now(),
      type: 'ring' as const,
      title: `Ring Saved: ${ringModel}`,
      message: `Serial ${ringSerial} - Status ${ringStatus}`,
      time: new Date().toLocaleString(),
      read: false
    };

    setNotifications((prev) => [item, ...prev]);
    setRingModel('');
    setRingSerial('');
    setRingStatus('In Stock');
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const dismissNotification = (id: number) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      <header className="h-20 bg-white border-b border-primary/10 flex items-center justify-between px-8 z-10 sticky top-0">
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
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/30 w-64"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className="p-2 text-slate-500 hover:bg-primary/5 rounded-full relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-primary text-white text-[10px] font-bold rounded-full grid place-items-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-12 w-[360px] bg-white border border-slate-300 rounded-xl shadow-xl z-30 overflow-hidden">
                <div className="p-3 border-b border-slate-300 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold text-primary hover:text-primary-dark"
                  >
                    Mark all read
                  </button>
                </div>

                <form onSubmit={addRingNotification} className="p-3 border-b border-slate-300 bg-slate-50/50 space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Store Ring Information</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={ringModel}
                      onChange={(e) => setRingModel(e.target.value)}
                      placeholder="Ring model"
                      className="px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                    <input
                      value={ringSerial}
                      onChange={(e) => setRingSerial(e.target.value)}
                      placeholder="Serial number"
                      className="px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={ringStatus}
                      onChange={(e) => setRingStatus(e.target.value)}
                      className="px-2 py-1.5 border border-slate-300 rounded text-xs"
                    >
                      <option>In Stock</option>
                      <option>Low Stock</option>
                      <option>Depleted</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-primary text-white text-xs font-bold hover:bg-primary-dark"
                    >
                      Save Ring Info
                    </button>
                  </div>
                </form>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-3 text-sm text-slate-600">No notifications yet.</p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 border-b border-slate-200 ${item.read ? 'bg-white' : 'bg-primary/5'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-700">{item.message}</p>
                            <span className="text-[11px] text-slate-500">{item.time}</span>
                          </div>
                          <button
                            onClick={() => dismissNotification(item.id)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-rose-700"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {showExportButton && (
            <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
          )}

          {showProvisionButton && (
            <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              Provision New Device
            </button>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
