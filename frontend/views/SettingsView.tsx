import React, { useEffect, useRef, useState } from 'react';

type NotificationKey =
  | 'systemUpdates'
  | 'securityAlerts'
  | 'orderPlacement'
  | 'pushNotifications';

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`toggle ${enabled ? 'toggle-on' : 'toggle-off'}`}
    aria-pressed={enabled}
  >
    <span className={`toggle-knob ${enabled ? 'toggle-knob-on' : 'toggle-knob-off'}`} />
  </button>
);

const SettingsView: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('https://picsum.photos/seed/alex/220/220');
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    systemUpdates: true,
    securityAlerts: true,
    orderPlacement: false,
    pushNotifications: true,
  });

  const toggleNotification = (key: NotificationKey) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleEditPhoto = () => {
    inputRef.current?.click();
  };

  const handleSelectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setAvatarUrl(nextUrl);
    event.currentTarget.value = '';
  };

  return (
    <main className="settings-page">
      <section className="settings-shell">
        <header className="settings-header">
          <h1>Settings</h1>
          <p>Manage account and notification preferences.</p>
        </header>

        <div className="settings-card">
          <h2>Profile</h2>
          <div className="profile-layout">
            <div className="profile-photo-wrap">
              <img
                className="profile-photo"
                src={avatarUrl}
                alt="Profile avatar"
                referrerPolicy="no-referrer"
              />
              <button type="button" className="photo-btn" onClick={handleEditPhoto}>
                Edit photo
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden-file-input"
                onChange={handleSelectPhoto}
              />
            </div>

            <div className="settings-grid">
              <label className="field">
                <span>Full Name</span>
                <input defaultValue="Alex Rivera" />
              </label>
              <label className="field">
                <span>Role</span>
                <input defaultValue="Super Admin" />
              </label>
              <label className="field field-wide">
                <span>Email</span>
                <input defaultValue="alex.rivera@aurarings.com" type="email" />
              </label>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>General</h2>
          <div className="settings-grid">
            <label className="field">
              <span>Shop Name</span>
              <input defaultValue="Aura Rings Main" />
            </label>
            <label className="field">
              <span>Support Email</span>
              <input defaultValue="support@aurarings.com" type="email" />
            </label>
            <label className="field field-wide">
              <span>Display Currency</span>
              <select>
                <option>USD ($)</option>
                <option>EUR (EUR)</option>
                <option>GBP (GBP)</option>
              </select>
            </label>
          </div>
        </div>

        <div className="settings-card">
          <h2>Notification Preferences</h2>
          <div className="notification-list">
            <div className="notification-item">
              <div>
                <h3>System Updates</h3>
                <p>Maintenance and feature alerts.</p>
              </div>
              <Toggle enabled={notifications.systemUpdates} onChange={() => toggleNotification('systemUpdates')} />
            </div>
            <div className="notification-item">
              <div>
                <h3>Security Alerts</h3>
                <p>Critical account safety notices.</p>
              </div>
              <Toggle enabled={notifications.securityAlerts} onChange={() => toggleNotification('securityAlerts')} />
            </div>
            <div className="notification-item">
              <div>
                <h3>Order Placement</h3>
                <p>Email alerts for new orders.</p>
              </div>
              <Toggle enabled={notifications.orderPlacement} onChange={() => toggleNotification('orderPlacement')} />
            </div>
            <div className="notification-item">
              <div>
                <h3>Push Notifications</h3>
                <p>Desktop alerts for urgent messages.</p>
              </div>
              <Toggle enabled={notifications.pushNotifications} onChange={() => toggleNotification('pushNotifications')} />
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="btn-secondary">
            Discard
          </button>
          <button type="button" className="btn-primary">
            Save Changes
          </button>
        </div>
      </section>
    </main>
  );
};

export default SettingsView;
