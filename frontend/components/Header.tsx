import React, { useState } from 'react';
import { Bell, Search, Plus, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const adminUsers = [
    { id: 'PR-9210', name: 'Sarah & Alex', email: 'sarah.alex@bondkeeper.app', status: 'Active' },
    { id: 'PR-5521', name: 'Elara & Jordan', email: 'elara.jordan@bondkeeper.app', status: 'Pending' },
    { id: 'PR-7714', name: 'Marcus & Sam', email: 'marcus.sam@bondkeeper.app', status: 'Suspended' },
    { id: 'PR-6638', name: 'Nova & Riley', email: 'nova.riley@bondkeeper.app', status: 'Active' },
    { id: 'PR-4397', name: 'Ari & Quinn', email: 'ari.quinn@bondkeeper.app', status: 'Outdated Firmware' }
  ];

  const filteredUsers = adminUsers.filter((user) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return false;
    return (
      user.name.toLowerCase().includes(q) ||
      user.id.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.status.toLowerCase().includes(q)
    );
  });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Pairing Request', message: 'User #8892 is waiting for approval.', time: '2 min ago', read: false },
    { id: 2, title: 'Firmware Outdated', message: '18 devices require firmware update.', time: '12 min ago', read: false },
    { id: 3, title: 'Inventory Alert', message: 'Low stock detected for Gen 3 - Rose Gold.', time: '45 min ago', read: true }
  ]);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [ringModel, setRingModel] = useState('Gen 3 Pro');
  const [firmware, setFirmware] = useState('v2.4.0');
  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleProvisionSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!deviceId.trim()) return;

    window.alert(`Device provisioned: ${deviceId} (${ringModel}, ${firmware})`);
    setIsProvisionOpen(false);
    setDeviceId('');
    setRingModel('Gen 3 Pro');
    setFirmware('v2.4.0');
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const dismissNotification = (id: number) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSearchSelect = (id: string) => {
    navigate('/users');
    setShowSearchResults(false);
    setSearchTerm(id);
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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search users in system..."
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/30 w-64"
            />
            {showSearchResults && (
              <div className="absolute top-11 left-0 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
                {searchTerm.trim() === '' ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Type name, pair ID, email or status.</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">No users found.</p>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSearchSelect(user.id)}
                      className="w-full text-left px-3 py-2 border-b border-slate-100 last:border-b-0 hover:bg-pink-100 active:bg-pink-200"
                    >
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-700">{user.id} • {user.email}</p>
                      <span className="text-[10px] font-semibold text-primary">{user.status}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className={`p-2 rounded-full relative transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 ${
                isNotificationOpen
                  ? 'text-pink-900 bg-pink-200 border-pink-300'
                  : 'text-slate-600 border-transparent hover:bg-pink-100 active:bg-pink-200'
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-primary text-white text-[10px] font-bold rounded-full grid place-items-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-12 w-[340px] bg-white border border-slate-200 rounded-xl shadow-xl z-30">
                <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold text-primary hover:text-primary-dark"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-600">No notifications</p>
                  ) : (
                    notifications.map((item) => (
                      <div key={item.id} className={`p-3 border-b border-slate-100 ${item.read ? 'bg-white' : 'bg-primary/5'}`}>
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
            <button className="bg-white border border-pink-300 text-pink-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-pink-100 active:bg-pink-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">
              <Download className="w-4 h-4" />
              Export
            </button>
          )}

          {showProvisionButton && (
            <button
              onClick={() => setIsProvisionOpen(true)}
              className="bg-[#ec1380] hover:bg-[#be0f66] active:bg-[#9f0d56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec1380] focus-visible:ring-offset-2 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#ec1380]/30"
            >
              <Plus className="w-4 h-4" />
              Provision New Device
            </button>
          )}
        </div>
      </header>

      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleProvisionSubmit}
            className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-5 space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-900">Provision New Device</h3>
              <p className="text-sm text-slate-600">Register a device for pairing and activation.</p>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-700 uppercase">Device ID</span>
              <input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                required
                placeholder="e.g. SR-1209-AX"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-700 uppercase">Ring Model</span>
              <select
                value={ringModel}
                onChange={(e) => setRingModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm"
              >
                <option>Gen 3 Pro</option>
                <option>Gen 3 Lite</option>
                <option>Classic Silver</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-700 uppercase">Firmware</span>
              <input
                value={firmware}
                onChange={(e) => setFirmware(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm"
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsProvisionOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#ec1380] text-white text-sm font-bold hover:bg-[#be0f66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec1380] focus-visible:ring-offset-2"
              >
                Provision
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Header;
