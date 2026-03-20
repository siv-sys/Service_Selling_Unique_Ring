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
  avatarUrl: string;
  fullName: string;
  role: string;
  email: string;
  systemUpdates: boolean;
  securityAlerts: boolean;
  orderPlacement: boolean;
  pushNotifications: boolean;
}

interface AdminProfileApiModel {
  full_name?: string;
  role?: string;
  email?: string;
  avatar_url?: string;
  system_updates?: boolean;
  security_alerts?: boolean;
  order_placement?: boolean;
  push_notifications?: boolean;
}

interface AdminProfileApiResponse {
  profile?: AdminProfileApiModel;
}

function normalizeAvatarUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  const lowered = normalized.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined' || lowered === 'none' || lowered === 'n/a') {
    return '';
  }

  if (
    /^https?:\/\//i.test(normalized) ||
    /^data:image\//i.test(normalized) ||
    /^blob:/i.test(normalized) ||
    normalized.startsWith('/')
  ) {
    return normalized;
  }

  return '';
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
  avatarUrl: '',
  fullName: '',
  role: '',
  email: '',
  systemUpdates: false,
  securityAlerts: false,
  orderPlacement: false,
  pushNotifications: false,
};

function isLegacyFakeProfile(settings: Partial<PersistedSettings>): boolean {
  return (
    String(settings.fullName || '').trim() === 'Alex Rivera' &&
    String(settings.role || '').trim() === 'Super Admin' &&
    String(settings.email || '').trim().toLowerCase() === 'alex.rivera@aurarings.com' &&
    String(settings.avatarUrl || '').trim() === 'https://picsum.photos/seed/alex/220/220'
  );
}

function loadSettings(): PersistedSettings {
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    if (isLegacyFakeProfile(parsed)) {
      return DEFAULT_SETTINGS;
    }
    return {
      avatarUrl: normalizeAvatarUrl(parsed.avatarUrl),
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : DEFAULT_SETTINGS.fullName,
      role: typeof parsed.role === 'string' ? parsed.role : DEFAULT_SETTINGS.role,
      email: typeof parsed.email === 'string' ? parsed.email : DEFAULT_SETTINGS.email,
      systemUpdates: Boolean(parsed.systemUpdates ?? DEFAULT_SETTINGS.systemUpdates),
      securityAlerts: Boolean(parsed.securityAlerts ?? DEFAULT_SETTINGS.securityAlerts),
      orderPlacement: Boolean(parsed.orderPlacement ?? DEFAULT_SETTINGS.orderPlacement),
      pushNotifications: Boolean(parsed.pushNotifications ?? DEFAULT_SETTINGS.pushNotifications),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function toPersistedSettings(profile?: AdminProfileApiModel): PersistedSettings {
  const maybeSettings: Partial<PersistedSettings> = {
    avatarUrl: typeof profile?.avatar_url === 'string' ? profile.avatar_url : undefined,
    fullName: typeof profile?.full_name === 'string' ? profile.full_name : undefined,
    role: typeof profile?.role === 'string' ? profile.role : undefined,
    email: typeof profile?.email === 'string' ? profile.email : undefined,
  };

  if (isLegacyFakeProfile(maybeSettings)) {
    return DEFAULT_SETTINGS;
  }

  return {
    avatarUrl: normalizeAvatarUrl(profile?.avatar_url),
    fullName: typeof profile?.full_name === 'string' ? profile.full_name : DEFAULT_SETTINGS.fullName,
    role: typeof profile?.role === 'string' ? profile.role : DEFAULT_SETTINGS.role,
    email: typeof profile?.email === 'string' ? profile.email : DEFAULT_SETTINGS.email,
    systemUpdates: Boolean(profile?.system_updates ?? DEFAULT_SETTINGS.systemUpdates),
    securityAlerts: Boolean(profile?.security_alerts ?? DEFAULT_SETTINGS.securityAlerts),
    orderPlacement: Boolean(profile?.order_placement ?? DEFAULT_SETTINGS.orderPlacement),
    pushNotifications: Boolean(profile?.push_notifications ?? DEFAULT_SETTINGS.pushNotifications),
  };
}

const SettingsView: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [savedSettings, setSavedSettings] = useState<PersistedSettings>(DEFAULT_SETTINGS);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_SETTINGS.avatarUrl);
  const [fullName, setFullName] = useState(DEFAULT_SETTINGS.fullName);
  const [role, setRole] = useState(DEFAULT_SETTINGS.role);
  const [email, setEmail] = useState(DEFAULT_SETTINGS.email);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
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

  const applySettingsState = (settings: PersistedSettings) => {
    setAvatarUrl(normalizeAvatarUrl(settings.avatarUrl));
    setFullName(settings.fullName);
    setRole(settings.role);
    setEmail(settings.email);
    setNotifications({
      systemUpdates: settings.systemUpdates,
      securityAlerts: settings.securityAlerts,
      orderPlacement: settings.orderPlacement,
      pushNotifications: settings.pushNotifications,
    });
  };

  useEffect(() => {
    const initial = loadSettings();
    setSavedSettings(initial);
    applySettingsState(initial);

    let isMounted = true;

    const loadFromBackend = async () => {
      try {
        const response = await api.get<AdminProfileApiResponse>('/settings/admin-profile');
        if (!isMounted) {
          return;
        }
        const fromBackend = toPersistedSettings(response.profile);
        setSavedSettings(fromBackend);
        applySettingsState(fromBackend);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(fromBackend));
        window.dispatchEvent(new Event('admin-profile-updated'));
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.warn('Failed to load admin profile from backend.', error);
      }
    };

    void loadFromBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEditPhoto = () => {
    inputRef.current?.click();
  };

  const handleSelectPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const nextUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read selected image file.'));
        reader.readAsDataURL(file);
      });

      if (!nextUrl) {
        throw new Error('Invalid image data.');
      }

      setAvatarUrl(nextUrl);
      setSaveStatus('idle');
      setSaveMessage('');
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to update photo.');
    } finally {
      event.currentTarget.value = '';
    }
  };

  const handleDiscard = () => {
    setAvatarUrl(savedSettings.avatarUrl);
    setFullName(savedSettings.fullName);
    setRole(savedSettings.role);
    setEmail(savedSettings.email);
    setNotifications({
      systemUpdates: savedSettings.systemUpdates,
      securityAlerts: savedSettings.securityAlerts,
      orderPlacement: savedSettings.orderPlacement,
      pushNotifications: savedSettings.pushNotifications,
    });
    setSaveStatus('idle');
    setSaveMessage('');
  };

  const handleCloseFeedback = () => {
    setSaveStatus('idle');
    setSaveMessage('');
  };

  const persistLocally = (nextSettings: PersistedSettings) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    window.dispatchEvent(new Event('admin-profile-updated'));
    setSavedSettings(nextSettings);
  };

  const handleSave = async () => {
    const safeAvatarUrl = normalizeAvatarUrl(avatarUrl);
    const nextSettings: PersistedSettings = {
      avatarUrl: safeAvatarUrl,
      fullName: fullName.trim(),
      role: role.trim(),
      email: email.trim(),
      systemUpdates: notifications.systemUpdates,
      securityAlerts: notifications.securityAlerts,
      orderPlacement: notifications.orderPlacement,
      pushNotifications: notifications.pushNotifications,
    };

    if (!nextSettings.fullName || !nextSettings.email) {
      setSaveStatus('error');
      setSaveMessage('Please fill Full Name and Email.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('loading');
    setSaveMessage('Saving your changes...');

    try {
      const response = await api.put<AdminProfileApiResponse>('/settings/admin-profile', {
        full_name: nextSettings.fullName,
        role: nextSettings.role,
        email: nextSettings.email,
        avatar_url: safeAvatarUrl,
        system_updates: nextSettings.systemUpdates,
        security_alerts: nextSettings.securityAlerts,
        order_placement: nextSettings.orderPlacement,
        push_notifications: nextSettings.pushNotifications,
      });
      const savedFromBackend = response.profile ? toPersistedSettings(response.profile) : nextSettings;
      applySettingsState(savedFromBackend);
      persistLocally(savedFromBackend);
      setSaveStatus('success');
      setSaveMessage('Settings saved successfully to backend.');
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save settings to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    avatarUrl !== savedSettings.avatarUrl ||
    fullName.trim() !== savedSettings.fullName ||
    role.trim() !== savedSettings.role ||
    email.trim() !== savedSettings.email ||
    notifications.securityAlerts !== savedSettings.securityAlerts ||
    notifications.orderPlacement !== savedSettings.orderPlacement ||
    notifications.pushNotifications !== savedSettings.pushNotifications ||
    notifications.systemUpdates !== savedSettings.systemUpdates;

  const displayAvatarUrl = normalizeAvatarUrl(avatarUrl);

  return (
    <main className="settings-page-clean">
      <section className="settings-shell settings-shell-wide">
        {saveStatus !== 'idle' && (
          <div className="settings-feedback-overlay">
            <div
              className={`settings-feedback settings-feedback-card settings-feedback-centered ${
                saveStatus === 'success' ? 'is-success' : saveStatus === 'error' ? 'is-error' : 'is-info'
              }`}
              role="status"
              aria-live="polite"
            >
              <div className="settings-feedback-icon">
                {saveStatus === 'success' ? 'OK' : saveStatus === 'error' ? 'ER' : '...'}
              </div>
              <div className="settings-feedback-content">
                <strong>
                  {saveStatus === 'success'
                    ? 'Changes Saved'
                    : saveStatus === 'error'
                    ? 'Save Failed'
                    : 'Saving Changes'}
                </strong>
                <p>{saveMessage}</p>
              </div>
              {saveStatus !== 'loading' && (
                <button
                  type="button"
                  className="settings-feedback-close"
                  onClick={handleCloseFeedback}
                  aria-label="Close message"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}

        <div className="settings-card">
          <h2>Profile</h2>
          <div className="profile-layout">
            <div className="profile-photo-wrap">
              {displayAvatarUrl ? (
                <img
                  className="profile-photo"
                  src={displayAvatarUrl}
                  alt="Profile avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="profile-photo profile-photo-empty" aria-label="No profile photo">
                  No photo
                </div>
              )}
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
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
              <label className="field">
                <span>Role</span>
                <input value={role} onChange={(event) => setRole(event.target.value)} />
              </label>
              <label className="field field-wide">
                <span>Email</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
              </label>
            </div>
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

        <div className="settings-actions settings-actions-wide">
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
