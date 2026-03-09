import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

type NotificationKey =
  | 'systemUpdates'
  | 'securityAlerts'
  | 'orderPlacement'
  | 'pushNotifications';

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
}

interface PersistedSettings {
  shopName: string;
  supportEmail: string;
  currency: string;
  systemUpdates: boolean;
  securityAlerts: boolean;
  orderPlacement: boolean;
  pushNotifications: boolean;
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

const SETTINGS_STORAGE_KEY = 'settings_view_v1';
const DEFAULT_SETTINGS: PersistedSettings = {
  shopName: 'Aura Rings Main',
  supportEmail: 'support@aurarings.com',
  currency: 'USD',
  systemUpdates: true,
  securityAlerts: true,
  orderPlacement: false,
  pushNotifications: true,
};

function loadSettings(): PersistedSettings {
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      shopName: String(parsed.shopName || DEFAULT_SETTINGS.shopName),
      supportEmail: String(parsed.supportEmail || DEFAULT_SETTINGS.supportEmail),
      currency: String(parsed.currency || DEFAULT_SETTINGS.currency),
      systemUpdates: Boolean(parsed.systemUpdates ?? DEFAULT_SETTINGS.systemUpdates),
      securityAlerts: Boolean(parsed.securityAlerts ?? DEFAULT_SETTINGS.securityAlerts),
      orderPlacement: Boolean(parsed.orderPlacement ?? DEFAULT_SETTINGS.orderPlacement),
      pushNotifications: Boolean(parsed.pushNotifications ?? DEFAULT_SETTINGS.pushNotifications),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const SettingsView: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [savedSettings, setSavedSettings] = useState<PersistedSettings>(DEFAULT_SETTINGS);
  const [avatarUrl, setAvatarUrl] = useState('https://picsum.photos/seed/alex/220/220');
  const [shopName, setShopName] = useState(DEFAULT_SETTINGS.shopName);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SETTINGS.supportEmail);
  const [currency, setCurrency] = useState(DEFAULT_SETTINGS.currency);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    systemUpdates: DEFAULT_SETTINGS.systemUpdates,
    securityAlerts: DEFAULT_SETTINGS.securityAlerts,
    orderPlacement: DEFAULT_SETTINGS.orderPlacement,
    pushNotifications: DEFAULT_SETTINGS.pushNotifications,
  });

  const toggleNotification = (key: NotificationKey) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const initial = loadSettings();
    setSavedSettings(initial);
    setShopName(initial.shopName);
    setSupportEmail(initial.supportEmail);
    setCurrency(initial.currency);
    setNotifications({
      systemUpdates: initial.systemUpdates,
      securityAlerts: initial.securityAlerts,
      orderPlacement: initial.orderPlacement,
      pushNotifications: initial.pushNotifications,
    });
  }, []);

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
    setSaveStatus('idle');
    setSaveMessage('');
    event.currentTarget.value = '';
  };

  const handleDiscard = () => {
    setShopName(savedSettings.shopName);
    setSupportEmail(savedSettings.supportEmail);
    setCurrency(savedSettings.currency);
    setNotifications({
      systemUpdates: savedSettings.systemUpdates,
      securityAlerts: savedSettings.securityAlerts,
      orderPlacement: savedSettings.orderPlacement,
      pushNotifications: savedSettings.pushNotifications,
    });
    setSaveStatus('idle');
    setSaveMessage('');
  };

  const persistLocally = (nextSettings: PersistedSettings) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    setSavedSettings(nextSettings);
  };

  const handleSave = async () => {
    const nextSettings: PersistedSettings = {
      shopName: shopName.trim(),
      supportEmail: supportEmail.trim(),
      currency: currency.trim().toUpperCase(),
      systemUpdates: notifications.systemUpdates,
      securityAlerts: notifications.securityAlerts,
      orderPlacement: notifications.orderPlacement,
      pushNotifications: notifications.pushNotifications,
    };

    if (!nextSettings.shopName || !nextSettings.supportEmail || !nextSettings.currency) {
      setSaveStatus('error');
      setSaveMessage('Please fill Shop Name, Support Email, and Currency.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');

    try {
      await api.put('/settings/system', {
        shop_name: nextSettings.shopName,
        support_email: nextSettings.supportEmail,
        currency: nextSettings.currency,
      });

      const rawUserId = sessionStorage.getItem('auth_user_id');
      const userId = Number(rawUserId);
      if (rawUserId && Number.isInteger(userId) && userId > 0) {
        await api.put(`/settings/notifications/${userId}`, {
          system_updates: nextSettings.systemUpdates,
        });
      }

      persistLocally(nextSettings);
      setSaveStatus('success');
      setSaveMessage('Settings saved successfully.');
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save settings to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    shopName.trim() !== savedSettings.shopName ||
    supportEmail.trim() !== savedSettings.supportEmail ||
    currency.trim().toUpperCase() !== savedSettings.currency ||
    notifications.systemUpdates !== savedSettings.systemUpdates ||
    notifications.securityAlerts !== savedSettings.securityAlerts ||
    notifications.orderPlacement !== savedSettings.orderPlacement ||
    notifications.pushNotifications !== savedSettings.pushNotifications;

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
              <input value={shopName} onChange={(event) => setShopName(event.target.value)} />
            </label>
            <label className="field">
              <span>Support Email</span>
              <input
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
                type="email"
              />
            </label>
            <label className="field field-wide">
              <span>Display Currency</span>
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (EUR)</option>
                <option value="GBP">GBP (GBP)</option>
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

        {saveStatus !== 'idle' && (
          <div className={`settings-feedback ${saveStatus === 'success' ? 'is-success' : 'is-error'}`}>
            {saveMessage}
          </div>
        )}

        <div className="settings-actions">
          <button type="button" className="btn-secondary" onClick={handleDiscard} disabled={!hasChanges || isSaving}>
            Discard
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>
    </main>
  );
};

export default SettingsView;
