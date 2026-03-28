import React from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import { api, resolveApiAssetUrl } from '../lib/api';
import { applyTheme, isStoredDarkModeEnabled, setDarkModePreference } from '../lib/theme';
import {
  getStoredAuthValue,
  getUserScopedLocalStorageItem,
  removeUserScopedLocalStorageItem,
  setUserScopedLocalStorageItem,
} from '../lib/userStorage';

const PROFILE_AVATAR_STORAGE_KEY = 'bondkeeper_user_avatar_url';
const LAST_EXPORT_STORAGE_KEY = 'eternal_rings_last_export';
const USER_AVATAR_UPDATED_EVENT = 'bondkeeper:user-avatar-updated';
const USER_PROFILE_UPDATED_EVENT = 'bondkeeper:user-profile-updated';
const DEFAULT_PROFILE_NAME = 'Member';
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80';

const menuItems = ['General', 'Security & Privacy', 'Help & Support'];
const languageOptions = ['English (US)', 'French (FR)'];
const DEFAULT_SETTINGS = {
  twoFactorEnabled: false,
  privacyLevel: 'Contacts',
  themeMode: 'Light',
  anniversaryReminders: true,
  systemUpdates: false,
  autoSync: true,
  language: 'English (US)',
  globalMute: false,
  dndEnabled: true,
  dndFromTime: '22:00',
  dndUntilTime: '07:00',
  repeatDaily: true,
  soundPrefs: {
    anniversary: 'Bell Chime',
    reminders: 'Soft Hum',
    messages: 'Digital Pop'
  },
  emailPrefs: {
    weeklyWrap: true,
    productTips: false,
    occasionReminders: true,
    partnerAlerts: true
  }
};
type SoundPreferenceKey = keyof typeof DEFAULT_SETTINGS.soundPrefs;

const SOUND_PRESET_LIBRARY: Record<
  SoundPreferenceKey,
  Record<string, { waveform: OscillatorType; notes: number[]; gain?: number }>
> = {
  anniversary: {
    'Bell Chime': { waveform: 'sine', notes: [659, 784, 988], gain: 0.12 },
    'Crystal Bell': { waveform: 'triangle', notes: [784, 1047, 1319], gain: 0.1 },
    'Warm Piano': { waveform: 'sine', notes: [523, 659, 784], gain: 0.14 },
  },
  reminders: {
    'Soft Hum': { waveform: 'sine', notes: [392, 440, 392], gain: 0.11 },
    'Wind Bell': { waveform: 'triangle', notes: [523, 659, 587], gain: 0.1 },
    'Gentle Pop': { waveform: 'square', notes: [494, 523, 494], gain: 0.06 },
  },
  messages: {
    'Digital Pop': { waveform: 'square', notes: [784, 659, 523], gain: 0.05 },
    'Pulse Beat': { waveform: 'sawtooth', notes: [659, 659, 494], gain: 0.04 },
    'Soft Tick': { waveform: 'triangle', notes: [988, 784, 988], gain: 0.05 },
  },
};
const sessions = [
  {
    name: 'MacBook Pro 16"',
    location: 'London, United Kingdom',
    status: 'Active now',
    badge: 'CURRENT',
    icon: '\u{1F4BB}'
  },
  {
    name: 'iPhone 15 Pro',
    location: 'Paris, France',
    status: 'Last active: 2 hours ago',
    badge: '',
    icon: '\u{1F4F1}'
  },
  {
    name: 'iPad Air',
    location: 'Berlin, Germany',
    status: 'Last active: Oct 12, 2023',
    badge: '',
    icon: '\u{1F4F2}'
  }
];
const INITIAL_NOTIFICATIONS = [
  {
    id: 'new-photo',
    icon: '\u{1F5BC}',
    iconClass: 'image',
    title: 'New photo added by partner',
    message: 'Emma just uploaded a new memory to your shared gallery.',
    time: '2 MINUTES AGO',
    unread: true
  },
  {
    id: 'anniversary',
    icon: '\u{1F4C5}',
    iconClass: 'calendar',
    title: 'Upcoming anniversary reminder',
    message: 'Your 2nd Anniversary is in 3 days. Time to celebrate!',
    time: '1 HOUR AGO',
    unread: true
  },
  {
    id: 'gift',
    icon: '\u{1F381}',
    iconClass: 'gift',
    title: 'Gift suggestion for you',
    message: 'Check out these personalized ring designs for your special day.',
    time: '5 HOURS AGO',
    unread: false
  },
  {
    id: 'system',
    icon: '\u2699',
    iconClass: 'system',
    title: 'System update',
    message: 'Eternal Rings v2.4 is now live with new relationship goals.',
    time: '1 DAY AGO',
    unread: false
  }
];

const getNextRenewalIsoDate = () => {
  const now = new Date();
  const nextRenewal = new Date(now.getFullYear(), 11, 12);
  if (nextRenewal.getTime() <= now.getTime()) {
    nextRenewal.setFullYear(now.getFullYear() + 1);
  }
  return nextRenewal.toISOString();
};

const getDefaultSubscription = () => ({
  planName: 'Premium Plan',
  autoRenewEnabled: true,
  renewingOn: getNextRenewalIsoDate()
});

const formatRenewingDate = (isoValue: string | null) => {
  if (!isoValue) return 'Renewal is paused';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return 'Renewal date unavailable';
  return `Renewing on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const formatLastSyncedLabel = (value: string | null, loading: boolean) => {
  if (loading) return 'Loading sync status...';
  if (!value) return 'Not synced yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Synced with your account settings';
  return `Last synced ${date.toLocaleString()}`;
};

const formatNotificationDate = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const resolveThemeMode = (value: unknown) =>
  isStoredDarkModeEnabled()
    ? 'Dark'
    : typeof value === 'string'
      ? value
      : DEFAULT_SETTINGS.themeMode;

const resolveLanguage = (value: unknown) =>
  typeof value === 'string' && languageOptions.includes(value) ? value : DEFAULT_SETTINGS.language;

type AdminSystemSettings = {
  shopName: string;
  supportEmail: string;
  currency: string;
  updatedAt: string | null;
};

type AdminProfileSettings = {
  title: string;
  handle: string;
  avatarUrl: string;
  email: string;
  role: string;
  togetherSince: string;
  phone: string;
};

type AdminNotificationPreferences = {
  systemUpdates: boolean;
  securityAlerts: boolean;
  orderPlacement: boolean;
  pushNotifications: boolean;
};

const DEFAULT_ADMIN_PROFILE_SETTINGS: AdminProfileSettings = {
  title: DEFAULT_PROFILE_NAME,
  handle: 'admin',
  avatarUrl: '',
  email: '',
  role: 'admin',
  togetherSince: 'Your personal profile.',
  phone: '',
};

const DEFAULT_ADMIN_NOTIFICATION_PREFERENCES: AdminNotificationPreferences = {
  systemUpdates: false,
  securityAlerts: false,
  orderPlacement: false,
  pushNotifications: false,
};

const SettingsView = ({
  onNavigateRelationship = () => {},
  onNavigateCoupleProfile = () => {},
  onNavigateProfile = () => {}
}) => {
  const navigate = useNavigate();
  const isAdminView =
    typeof window !== 'undefined' && sessionStorage.getItem('auth_roles') === 'admin';
  const [activeMenu, setActiveMenu] = React.useState('General');
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const [privacyLevel, setPrivacyLevel] = React.useState('Contacts');
  const [themeMode, setThemeMode] = React.useState(() => (isAdminView ? 'Light' : isStoredDarkModeEnabled() ? 'Dark' : 'Light'));
  const [anniversaryReminders, setAnniversaryReminders] = React.useState(true);
  const [systemUpdates, setSystemUpdates] = React.useState(false);
  const [autoSync, setAutoSync] = React.useState(true);
  const [language, setLanguage] = React.useState('English (US)');
  const [languageSearch, setLanguageSearch] = React.useState('');
  const [globalMute, setGlobalMute] = React.useState(false);
  const [dndEnabled, setDndEnabled] = React.useState(true);
  const [dndFromTime, setDndFromTime] = React.useState(DEFAULT_SETTINGS.dndFromTime);
  const [dndUntilTime, setDndUntilTime] = React.useState(DEFAULT_SETTINGS.dndUntilTime);
  const [repeatDaily, setRepeatDaily] = React.useState(true);
  const [soundPrefs, setSoundPrefs] = React.useState(DEFAULT_SETTINGS.soundPrefs);
  const [playingSoundId, setPlayingSoundId] = React.useState<string | null>(null);
  const [emailPrefs, setEmailPrefs] = React.useState({
    weeklyWrap: true,
    productTips: false,
    occasionReminders: true,
    partnerAlerts: true
  });
  const [activeSessions, setActiveSessions] = React.useState(sessions);
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null);
  const [lastExportAt, setLastExportAt] = React.useState<string | null>(() => {
    try {
      return getUserScopedLocalStorageItem(LAST_EXPORT_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);
  const [saveMessage, setSaveMessage] = React.useState('');
  const [settingsLoading, setSettingsLoading] = React.useState(true);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);
  const [isExportingData, setIsExportingData] = React.useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(INITIAL_NOTIFICATIONS);
  const notificationPanelRef = React.useRef(null);
  const soundPreviewTimerRef = React.useRef<number | null>(null);
  const soundPreviewContextRef = React.useRef<AudioContext | null>(null);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = React.useState(false);
  const [isLogoutAllConfirmOpen, setIsLogoutAllConfirmOpen] = React.useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);
  const [isTwoFactorWizardOpen, setIsTwoFactorWizardOpen] = React.useState(false);
  const [isUpdatingTwoFactor, setIsUpdatingTwoFactor] = React.useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = React.useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = React.useState(false);
  const [subscription, setSubscription] = React.useState(getDefaultSubscription());
  const [navAvatar, setNavAvatar] = React.useState(() => {
    try {
      return getUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY) || DEFAULT_AVATAR;
    } catch {
      return DEFAULT_AVATAR;
    }
  });
  const [navDisplayName, setNavDisplayName] = React.useState(() => {
    if (typeof window === 'undefined') return DEFAULT_PROFILE_NAME;
    return sessionStorage.getItem('auth_name')?.trim() || DEFAULT_PROFILE_NAME;
  });
  const [navEmail, setNavEmail] = React.useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('auth_email')?.trim() || '';
  });
  const [adminSystemSettings, setAdminSystemSettings] = React.useState<AdminSystemSettings>({
    shopName: '',
    supportEmail: '',
    currency: 'USD',
    updatedAt: null,
  });
  const [adminSettingsLoading, setAdminSettingsLoading] = React.useState(false);
  const [adminSettingsError, setAdminSettingsError] = React.useState('');
  const [isAdminSaving, setIsAdminSaving] = React.useState(false);
  const [adminProfileSettings, setAdminProfileSettings] = React.useState<AdminProfileSettings>({
    ...DEFAULT_ADMIN_PROFILE_SETTINGS,
    email: typeof window === 'undefined' ? '' : sessionStorage.getItem('auth_email')?.trim() || '',
    role: typeof window === 'undefined' ? 'admin' : sessionStorage.getItem('auth_roles')?.trim() || 'admin',
  });
  const [savedAdminProfileSettings, setSavedAdminProfileSettings] = React.useState<AdminProfileSettings>({
    ...DEFAULT_ADMIN_PROFILE_SETTINGS,
    email: typeof window === 'undefined' ? '' : sessionStorage.getItem('auth_email')?.trim() || '',
    role: typeof window === 'undefined' ? 'admin' : sessionStorage.getItem('auth_roles')?.trim() || 'admin',
  });
  const [adminNotificationPreferences, setAdminNotificationPreferences] = React.useState<AdminNotificationPreferences>(
    DEFAULT_ADMIN_NOTIFICATION_PREFERENCES,
  );
  const [savedAdminNotificationPreferences, setSavedAdminNotificationPreferences] =
    React.useState<AdminNotificationPreferences>(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES);
  const [savedAdminSystemSettings, setSavedAdminSystemSettings] = React.useState<AdminSystemSettings>({
    shopName: '',
    supportEmail: '',
    currency: 'USD',
    updatedAt: null,
  });
  const adminAvatarInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    let active = true;

    const syncProfileIdentity = async () => {
      try {
        setNavAvatar(getUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY) || DEFAULT_AVATAR);
      } catch {
        setNavAvatar(DEFAULT_AVATAR);
      }

      setNavDisplayName(sessionStorage.getItem('auth_name')?.trim() || DEFAULT_PROFILE_NAME);
      setNavEmail(sessionStorage.getItem('auth_email')?.trim() || '');

      const rawUserId = getStoredAuthValue('auth_user_id');
      if (!rawUserId) return;

      try {
        const user = await api.get<{ fullName: string; avatarUrl: string | null }>(`/users/${rawUserId}`);
        if (!active) return;

        setNavDisplayName(user.fullName || sessionStorage.getItem('auth_name')?.trim() || DEFAULT_PROFILE_NAME);
        setNavAvatar(user.avatarUrl || getUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY) || DEFAULT_AVATAR);
      } catch {
        // Keep the local fallback values.
      }
    };

    const handleProfileSync = () => {
      void syncProfileIdentity();
    };

    void syncProfileIdentity();

    window.addEventListener('focus', handleProfileSync);
    window.addEventListener('storage', handleProfileSync);
    window.addEventListener(USER_AVATAR_UPDATED_EVENT, handleProfileSync);
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileSync);

    return () => {
      active = false;
      window.removeEventListener('focus', handleProfileSync);
      window.removeEventListener('storage', handleProfileSync);
      window.removeEventListener(USER_AVATAR_UPDATED_EVENT, handleProfileSync);
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileSync);
    };
  }, []);

  React.useEffect(() => {
    if (isAdminView) {
      setNotifications([]);
      return undefined;
    }

    let active = true;

    const loadNotifications = async () => {
      try {
        const data: any = await api.get('/notifications/me');
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(data);
        }
      } catch {
        // Keep UI fallback notifications if backend data is unavailable.
      }
    };

    loadNotifications();

    return () => {
      active = false;
    };
  }, [isAdminView]);

  React.useEffect(() => {
    if (!isNotificationOpen) {
      return;
    }

    const handleClickAway = (event: MouseEvent) => {
      if (!notificationPanelRef.current) return;
      if (!(event.target instanceof Node)) return;
      if (!notificationPanelRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNotificationOpen]);

  React.useEffect(() => {
    if (isAdminView) {
      setSettingsLoading(false);
      return undefined;
    }

    let active = true;

    const loadSettings = async () => {
      try {
        const data: any = await api.get('/settings/me');
        if (!active) return;
        setTwoFactorEnabled(Boolean(data?.twoFactorEnabled));
        setPrivacyLevel(typeof data?.privacyLevel === 'string' ? data.privacyLevel : DEFAULT_SETTINGS.privacyLevel);
        setThemeMode(resolveThemeMode(data?.themeMode));
        setAnniversaryReminders(Boolean(data?.anniversaryReminders));
        setSystemUpdates(Boolean(data?.systemUpdates));
        setAutoSync(Boolean(data?.autoSync));
        setLanguage(resolveLanguage(data?.language));
        setGlobalMute(Boolean(data?.globalMute));
        setDndEnabled(Boolean(data?.dndEnabled));
        setDndFromTime(typeof data?.dndFromTime === 'string' ? data.dndFromTime : DEFAULT_SETTINGS.dndFromTime);
        setDndUntilTime(typeof data?.dndUntilTime === 'string' ? data.dndUntilTime : DEFAULT_SETTINGS.dndUntilTime);
        setRepeatDaily(Boolean(data?.repeatDaily));
        setSoundPrefs({
          anniversary: typeof data?.soundPrefs?.anniversary === 'string' ? data.soundPrefs.anniversary : DEFAULT_SETTINGS.soundPrefs.anniversary,
          reminders: typeof data?.soundPrefs?.reminders === 'string' ? data.soundPrefs.reminders : DEFAULT_SETTINGS.soundPrefs.reminders,
          messages: typeof data?.soundPrefs?.messages === 'string' ? data.soundPrefs.messages : DEFAULT_SETTINGS.soundPrefs.messages,
        });
        setEmailPrefs({
          weeklyWrap: Boolean(data?.emailPrefs?.weeklyWrap),
          productTips: Boolean(data?.emailPrefs?.productTips),
          occasionReminders: Boolean(data?.emailPrefs?.occasionReminders),
          partnerAlerts: Boolean(data?.emailPrefs?.partnerAlerts),
        });
        setSubscription(data?.subscription ? {
          planName: typeof data.subscription.planName === 'string' ? data.subscription.planName : 'Premium Plan',
          autoRenewEnabled: Boolean(data.subscription.autoRenewEnabled),
          renewingOn: typeof data.subscription.renewingOn === 'string' || data.subscription.renewingOn === null ? data.subscription.renewingOn : null,
        } : getDefaultSubscription());
        setActiveSessions(Array.isArray(data?.activeSessions) ? data.activeSessions : sessions);
        setLastExportAt(typeof data?.lastExportAt === 'string' || data?.lastExportAt === null ? data.lastExportAt : null);
        setLastSyncedAt(typeof data?.lastSyncedAt === 'string' || data?.lastSyncedAt === null ? data.lastSyncedAt : null);
      } catch {
        // Keep defaults if backend data is unavailable.
      } finally {
        if (active) {
          setSettingsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, [isAdminView]);

  React.useEffect(() => {
    if (!isAdminView) {
      return undefined;
    }

    let active = true;

    const loadAdminSettings = async () => {
      setAdminSettingsLoading(true);
      setAdminSettingsError('');

      try {
        if (!active) return;
        await Promise.all([
          loadAdminProfileSettings(),
          loadAdminNotificationPreferences(),
          loadAdminSystemSettings({ silent: true }),
        ]);
      } catch (error) {
        if (!active) return;
        setAdminSettingsError(error instanceof Error ? error.message : 'Failed to load admin settings.');
      } finally {
        if (active) {
          setAdminSettingsLoading(false);
          setSettingsLoading(false);
        }
      }
    };

    void loadAdminSettings();

    return () => {
      active = false;
    };
  }, [isAdminView]);

  const showSaveMessage = (message: string) => {
    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(''), 2000);
  };

  const stopSoundPreview = React.useCallback(() => {
    if (soundPreviewTimerRef.current) {
      window.clearTimeout(soundPreviewTimerRef.current);
      soundPreviewTimerRef.current = null;
    }
    if (soundPreviewContextRef.current) {
      soundPreviewContextRef.current.close().catch(() => {});
      soundPreviewContextRef.current = null;
    }
    setPlayingSoundId(null);
  }, []);

  const loadAdminProfileSettings = async () => {
    const fallbackEmail = sessionStorage.getItem('auth_email')?.trim() || '';
    const fallbackRole = sessionStorage.getItem('auth_roles')?.trim() || 'admin';
    const fallbackName = sessionStorage.getItem('auth_name')?.trim() || DEFAULT_PROFILE_NAME;
    const rawUserId = getStoredAuthValue('auth_user_id');

    try {
      const [profile, user]: any = await Promise.all([
        api.get('/profile/me/current'),
        rawUserId ? api.get(`/users/${rawUserId}`).catch(() => null) : Promise.resolve(null),
      ]);
      const resolvedAvatarUrl =
        user && typeof user === 'object' && 'avatarUrl' in user
          ? user.avatarUrl || profile?.avatarUrl || ''
          : typeof profile?.avatarUrl === 'string'
            ? profile.avatarUrl
            : '';
      const nextProfile: AdminProfileSettings = {
        title: typeof profile?.title === 'string' && profile.title.trim() ? profile.title : fallbackName,
        handle: typeof profile?.handle === 'string' && profile.handle.trim()
          ? profile.handle
          : `admin_${rawUserId || 'member'}`,
        avatarUrl: typeof resolvedAvatarUrl === 'string' ? resolvedAvatarUrl : '',
        email: fallbackEmail,
        role: fallbackRole,
        togetherSince:
          typeof profile?.togetherSince === 'string' && profile.togetherSince.trim()
            ? profile.togetherSince
            : 'Your personal profile.',
        phone: typeof profile?.phone === 'string' ? profile.phone : '',
      };
      setAdminProfileSettings(nextProfile);
      setSavedAdminProfileSettings(nextProfile);
    } catch (error) {
      const fallbackProfile: AdminProfileSettings = {
        ...DEFAULT_ADMIN_PROFILE_SETTINGS,
        title: fallbackName,
        handle: `admin_${rawUserId || 'member'}`,
        email: fallbackEmail,
        role: fallbackRole,
      };
      setAdminProfileSettings(fallbackProfile);
      setSavedAdminProfileSettings(fallbackProfile);
      throw error;
    }
  };

  const loadAdminNotificationPreferences = async () => {
    const rawUserId = Number(getStoredAuthValue('auth_user_id'));
    if (!Number.isInteger(rawUserId) || rawUserId <= 0) {
      setAdminNotificationPreferences(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES);
      setSavedAdminNotificationPreferences(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES);
      return;
    }

    try {
      const data: any = await api.get(`/settings/notifications/${rawUserId}`);
      const preferences = data?.preferences ?? data;
      const nextPreferences: AdminNotificationPreferences = {
        systemUpdates: Boolean(preferences?.system_updates),
        securityAlerts: Boolean(preferences?.security_alerts),
        orderPlacement: Boolean(preferences?.order_placement),
        pushNotifications: Boolean(preferences?.push_notifications),
      };
      setAdminNotificationPreferences(nextPreferences);
      setSavedAdminNotificationPreferences(nextPreferences);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('not found')) {
        setAdminNotificationPreferences(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES);
        setSavedAdminNotificationPreferences(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES);
        return;
      }
      throw error;
    }
  };

  const loadAdminSystemSettings = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      const data: any = await api.get('/settings/system');
      const settings = data?.settings ?? data;
      const nextSystemSettings: AdminSystemSettings = {
        shopName: typeof settings?.shop_name === 'string' ? settings.shop_name : '',
        supportEmail: typeof settings?.support_email === 'string' ? settings.support_email : '',
        currency: typeof settings?.currency === 'string' ? settings.currency : 'USD',
        updatedAt:
          typeof settings?.updated_at === 'string' || settings?.updated_at === null
            ? settings.updated_at
            : null,
      };
      setAdminSystemSettings(nextSystemSettings);
      setSavedAdminSystemSettings(nextSystemSettings);
      if (!silent) {
        showSaveMessage('Loaded');
      }
    } catch (error) {
      if (!silent) {
        setAdminSettingsError(error instanceof Error ? error.message : 'Failed to load system settings.');
        showSaveMessage('Load failed');
      }
      throw error;
    }
  };

  const handleAdminAvatarSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read the selected image.'));
        reader.readAsDataURL(file);
      });
      setAdminProfileSettings((current) => ({
        ...current,
        avatarUrl: dataUrl,
      }));
      setNavAvatar(dataUrl || DEFAULT_AVATAR);
      setAdminSettingsError('');
    } catch (error) {
      setAdminSettingsError(error instanceof Error ? error.message : 'Failed to read image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleDiscardAdminChanges = () => {
    setAdminProfileSettings(savedAdminProfileSettings);
    setAdminNotificationPreferences(savedAdminNotificationPreferences);
    setAdminSystemSettings(savedAdminSystemSettings);
    setNavAvatar(savedAdminProfileSettings.avatarUrl || DEFAULT_AVATAR);
    setAdminSettingsError('');
    showSaveMessage('Discarded');
  };

  const handleSaveAdminSettings = async () => {
    const rawUserId = Number(getStoredAuthValue('auth_user_id'));
    if (!Number.isInteger(rawUserId) || rawUserId <= 0) {
      setAdminSettingsError('Admin session is missing a valid user id.');
      return;
    }

    try {
      setIsAdminSaving(true);
      setAdminSettingsError('');
      const profilePayload = {
        title: adminProfileSettings.title.trim() || DEFAULT_PROFILE_NAME,
        handle: adminProfileSettings.handle,
        avatarUrl: adminProfileSettings.avatarUrl || null,
        togetherSince: adminProfileSettings.togetherSince,
        phone: adminProfileSettings.phone,
      };
      let persistedAvatarUrl = adminProfileSettings.avatarUrl || '';

      if (adminProfileSettings.avatarUrl !== savedAdminProfileSettings.avatarUrl) {
        const avatarResponse = await api.patch<{ avatarUrl?: string }>(`/users/${rawUserId}/avatar`, {
          avatarUrl: adminProfileSettings.avatarUrl || null,
        });
        persistedAvatarUrl = avatarResponse?.avatarUrl || adminProfileSettings.avatarUrl || '';
      }

      const [profileData, notificationData, systemData]: any = await Promise.all([
        api.patch('/profile/me/current', {
          ...profilePayload,
          avatarUrl: persistedAvatarUrl || null,
        }),
        api.put(`/settings/notifications/${rawUserId}`, {
          system_updates: adminNotificationPreferences.systemUpdates,
          security_alerts: adminNotificationPreferences.securityAlerts,
          order_placement: adminNotificationPreferences.orderPlacement,
          push_notifications: adminNotificationPreferences.pushNotifications,
        }),
        api.put('/settings/system', {
          shop_name: adminSystemSettings.shopName.trim(),
          support_email: adminSystemSettings.supportEmail.trim(),
          currency: adminSystemSettings.currency.trim().toUpperCase(),
        }),
      ]);

      const nextProfile: AdminProfileSettings = {
        title:
          typeof profileData?.title === 'string' && profileData.title.trim()
            ? profileData.title
            : profilePayload.title,
        handle:
          typeof profileData?.handle === 'string' && profileData.handle.trim()
            ? profileData.handle
            : profilePayload.handle,
        avatarUrl:
          typeof profileData?.avatarUrl === 'string' && profileData.avatarUrl.trim()
            ? profileData.avatarUrl
            : persistedAvatarUrl,
        email: adminProfileSettings.email,
        role: adminProfileSettings.role,
        togetherSince:
          typeof profileData?.togetherSince === 'string'
            ? profileData.togetherSince
            : adminProfileSettings.togetherSince,
        phone: typeof profileData?.phone === 'string' ? profileData.phone : adminProfileSettings.phone,
      };

      const preferences = notificationData?.preferences ?? notificationData;
      const nextPreferences: AdminNotificationPreferences = {
        systemUpdates: Boolean(preferences?.system_updates),
        securityAlerts: Boolean(preferences?.security_alerts),
        orderPlacement: Boolean(preferences?.order_placement),
        pushNotifications: Boolean(preferences?.push_notifications),
      };

      const settings = systemData?.settings ?? systemData;
      const nextSystemSettings: AdminSystemSettings = {
        shopName: typeof settings?.shop_name === 'string' ? settings.shop_name : adminSystemSettings.shopName,
        supportEmail:
          typeof settings?.support_email === 'string'
            ? settings.support_email
            : adminSystemSettings.supportEmail,
        currency: typeof settings?.currency === 'string' ? settings.currency : adminSystemSettings.currency,
        updatedAt:
          typeof settings?.updated_at === 'string' || settings?.updated_at === null
            ? settings.updated_at
            : adminSystemSettings.updatedAt,
      };

      setAdminProfileSettings(nextProfile);
      setSavedAdminProfileSettings(nextProfile);
      setAdminNotificationPreferences(nextPreferences);
      setSavedAdminNotificationPreferences(nextPreferences);
      setAdminSystemSettings(nextSystemSettings);
      setSavedAdminSystemSettings(nextSystemSettings);
      setAdminSettingsError('');
      if (nextProfile.avatarUrl) {
        setUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY, nextProfile.avatarUrl);
      } else {
        removeUserScopedLocalStorageItem(PROFILE_AVATAR_STORAGE_KEY);
      }
      sessionStorage.setItem('auth_name', nextProfile.title);
      setNavDisplayName(nextProfile.title);
      setNavAvatar(nextProfile.avatarUrl || DEFAULT_AVATAR);
      window.dispatchEvent(new Event(USER_PROFILE_UPDATED_EVENT));
      window.dispatchEvent(new Event(USER_AVATAR_UPDATED_EVENT));
      showSaveMessage('Saved');
    } catch (error) {
      setAdminSettingsError(error instanceof Error ? error.message : 'Failed to save admin settings.');
      showSaveMessage('Save failed');
    } finally {
      setIsAdminSaving(false);
    }
  };

  const saveSettings = async (overrides: Partial<Record<string, unknown>> = {}) => {
    const payload = {
      twoFactorEnabled,
      privacyLevel,
      themeMode,
      anniversaryReminders,
      systemUpdates,
      autoSync,
      language,
      globalMute,
      dndEnabled,
      dndFromTime,
      dndUntilTime,
      repeatDaily,
      soundPrefs,
      emailPrefs,
      ...overrides,
    };

    const data: any = await api.put('/settings/me', payload);
    setLastSyncedAt(typeof data?.lastSyncedAt === 'string' || data?.lastSyncedAt === null ? data.lastSyncedAt : null);
    setLastExportAt(typeof data?.lastExportAt === 'string' || data?.lastExportAt === null ? data.lastExportAt : null);
    return data;
  };

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);
      await saveSettings();
      showSaveMessage('Saved');
    } catch {
      showSaveMessage('Save failed');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAutoSyncToggle = async () => {
    const nextAutoSync = !autoSync;
    setAutoSync(nextAutoSync);

    try {
      setIsSavingSettings(true);
      await saveSettings({ autoSync: nextAutoSync });
      showSaveMessage(nextAutoSync ? 'Auto-sync enabled' : 'Auto-sync disabled');
    } catch {
      setAutoSync(!nextAutoSync);
      showSaveMessage('Could not update auto-sync');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      const data: any = await api.delete('/settings/me');
      setTwoFactorEnabled(Boolean(data?.twoFactorEnabled));
      setPrivacyLevel(typeof data?.privacyLevel === 'string' ? data.privacyLevel : DEFAULT_SETTINGS.privacyLevel);
      setThemeMode(resolveThemeMode(data?.themeMode));
      setAnniversaryReminders(Boolean(data?.anniversaryReminders));
      setSystemUpdates(Boolean(data?.systemUpdates));
      setAutoSync(Boolean(data?.autoSync));
      setLanguage(resolveLanguage(data?.language));
      setGlobalMute(Boolean(data?.globalMute));
      setDndEnabled(Boolean(data?.dndEnabled));
      setDndFromTime(typeof data?.dndFromTime === 'string' ? data.dndFromTime : DEFAULT_SETTINGS.dndFromTime);
      setDndUntilTime(typeof data?.dndUntilTime === 'string' ? data.dndUntilTime : DEFAULT_SETTINGS.dndUntilTime);
      setRepeatDaily(Boolean(data?.repeatDaily));
      setSoundPrefs({
        anniversary: typeof data?.soundPrefs?.anniversary === 'string' ? data.soundPrefs.anniversary : DEFAULT_SETTINGS.soundPrefs.anniversary,
        reminders: typeof data?.soundPrefs?.reminders === 'string' ? data.soundPrefs.reminders : DEFAULT_SETTINGS.soundPrefs.reminders,
        messages: typeof data?.soundPrefs?.messages === 'string' ? data.soundPrefs.messages : DEFAULT_SETTINGS.soundPrefs.messages,
      });
      setEmailPrefs({
        weeklyWrap: Boolean(data?.emailPrefs?.weeklyWrap),
        productTips: Boolean(data?.emailPrefs?.productTips),
        occasionReminders: Boolean(data?.emailPrefs?.occasionReminders),
        partnerAlerts: Boolean(data?.emailPrefs?.partnerAlerts),
      });
      setLastExportAt(typeof data?.lastExportAt === 'string' || data?.lastExportAt === null ? data.lastExportAt : null);
      setLastSyncedAt(typeof data?.lastSyncedAt === 'string' || data?.lastSyncedAt === null ? data.lastSyncedAt : null);
      setLanguageSearch('');
      showSaveMessage('Reset to defaults');
    } catch {
      showSaveMessage('Reset failed');
    }
  };
  const unreadCount = notifications.filter((item) => item.unread).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
    api.patch('/notifications/me/read-all', {}).catch(() => {});
  };

  const handleNotificationClick = (item: any) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === item.id ? { ...notification, unread: false } : notification
      )
    );

    api.patch(`/notifications/me/${item.id}/read`, {}).catch(() => {});

    if (item.actionKey === 'couple_profile') {
      setIsNotificationOpen(false);
      onNavigateCoupleProfile();
      return;
    }

    if (item.actionKey === 'pair_invitation_accept_reject') {
      // Don't close notification - show action buttons
      return;
    }

    if (item.actionKey === 'help_support') {
      setActiveMenu('Help & Support');
    } else if (item.actionKey === 'general') {
      setActiveMenu('General');
    } else if (item.iconClass === 'calendar') {
      setActiveMenu('Help & Support');
    } else {
      setActiveMenu('General');
    }

    setIsNotificationOpen(false);
  };

  const handleAcceptInvitation = async (notification: any) => {
    try {
      const invitationId = notification.metadata?.invitationId;
      if (!invitationId) {
        showSaveMessage('Invalid invitation');
        return;
      }

      const result: any = await api.post(`/pair-invitations/${invitationId}/accept`, {});
      
      if ((result as any).success) {
        showSaveMessage('Connection accepted! Redirecting...');
        // Remove notification from list
        setNotifications((current) => current.filter((n) => n.id !== notification.id));
        // Close panel
        setIsNotificationOpen(false);
        // Optionally navigate to relationship page
        setTimeout(() => {
          onNavigateCoupleProfile();
        }, 1000);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showSaveMessage('Failed to accept invitation');
    }
  };

  const handleRejectInvitation = async (notification: any) => {
    try {
      const invitationId = notification.metadata?.invitationId;
      if (!invitationId) {
        showSaveMessage('Invalid invitation');
        return;
      }

      const result: any = await api.post(`/pair-invitations/${invitationId}/reject`, {});
      
      if ((result as any).success) {
        showSaveMessage('Invitation declined');
        // Remove notification from list
        setNotifications((current) => current.filter((n) => n.id !== notification.id));
        // Close panel
        setIsNotificationOpen(false);
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      showSaveMessage('Failed to decline invitation');
    }
  };

  React.useEffect(() => {
    if (globalMute && playingSoundId) {
      stopSoundPreview();
    }
  }, [globalMute, playingSoundId, stopSoundPreview]);

  const playSoundPreview = (soundId: SoundPreferenceKey) => {
    if (globalMute) {
      showSaveMessage('Turn off Global Mute to preview sounds');
      return;
    }
    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        showSaveMessage('Sound preview unavailable');
        return;
      }

      stopSoundPreview();
      const selectedPreset = soundPrefs[soundId];
      const presetLibrary = SOUND_PRESET_LIBRARY[soundId];
      const fallbackPreset = Object.values(presetLibrary)[0];
      const preset = presetLibrary[selectedPreset] || fallbackPreset;
      const notes = preset.notes;
      const context = new AudioContextCtor();
      soundPreviewContextRef.current = context;
      const startAt = context.currentTime + 0.01;
      const noteDuration = 0.2;
      const gap = 0.03;

      notes.forEach((freq, index) => {
        const noteStart = startAt + index * (noteDuration + gap);
        const noteEnd = noteStart + noteDuration;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = preset.waveform;
        oscillator.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(preset.gain ?? 0.12, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteEnd);
      });

      const totalMs = Math.ceil((notes.length * (noteDuration + gap) + 0.08) * 1000);
      setPlayingSoundId(soundId);
      soundPreviewTimerRef.current = window.setTimeout(() => {
        if (soundPreviewContextRef.current === context) {
          soundPreviewContextRef.current = null;
        }
        soundPreviewTimerRef.current = null;
        setPlayingSoundId(null);
        context.close().catch(() => {});
      }, totalMs);
    } catch {
      showSaveMessage('Unable to play preview');
    }
  };

  const formatExportTime = (value: string | null) => {
    if (!value) return 'Last export: never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Last export: never';
    return `Last export: ${date.toLocaleString()}`;
  };

  const handleExportData = async () => {
    try {
      setIsExportingData(true);
      const now = new Date();
      const payload = {
        exportedAt: now.toISOString(),
        app: 'Eternal Rings',
        settings: {
          twoFactorEnabled,
          privacyLevel,
          themeMode,
          anniversaryReminders,
          systemUpdates,
          autoSync,
          language,
          globalMute,
          dndEnabled,
          dndFromTime,
          dndUntilTime,
          repeatDaily,
          soundPrefs,
          emailPrefs
        },
        activeSessions,
        notifications
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filenameDate = now.toISOString().replace(/[:.]/g, '-');
      link.href = downloadUrl;
      link.download = `eternal-rings-data-${filenameDate}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      const exportResponse: any = await api.post('/settings/me/export', {});
      if (typeof exportResponse?.lastExportAt === 'string' || exportResponse?.lastExportAt === null) {
        setLastExportAt(exportResponse.lastExportAt);
      }

      const iso = now.toISOString();
      setLastExportAt(iso);
      showSaveMessage('Data exported');
    } catch {
      showSaveMessage('Export failed');
    } finally {
      setIsExportingData(false);
    }
  };

  const openDeleteSessionConfirm = (sessionId: string | number) => {
    setSessionToDelete(String(sessionId));
  };

  const closeDeleteSessionConfirm = () => {
    setSessionToDelete(null);
  };

  const confirmDeleteSession = () => {
    if (!sessionToDelete) return;
    const session = activeSessions.find((item) => String(item.id) === sessionToDelete);
    if (!session) return;
    api.delete(`/settings/me/sessions/${session.id}`).then((data: any) => {
      setActiveSessions(Array.isArray(data?.activeSessions) ? data.activeSessions : []);
      setSessionToDelete(null);
      showSaveMessage('Session removed');
    }).catch(() => {
      setSessionToDelete(null);
      showSaveMessage('Remove failed');
    });
  };

  const openLogoutAllConfirm = () => {
    setIsLogoutAllConfirmOpen(true);
  };

  const closeLogoutAllConfirm = () => {
    setIsLogoutAllConfirmOpen(false);
  };

  const confirmLogoutAllDevices = () => {
    api.post('/settings/me/sessions/logout-all', {}).then(() => {
      setActiveSessions([]);
      setIsNotificationOpen(false);
      setIsLogoutAllConfirmOpen(false);
      showSaveMessage('Logged out on all devices');
    }).catch(() => {
      setIsLogoutAllConfirmOpen(false);
      showSaveMessage('Logout failed');
    });
  };

  const openDeleteAccountConfirm = () => {
    setIsDeleteAccountConfirmOpen(true);
  };

  const closeDeleteAccountConfirm = () => {
    setIsDeleteAccountConfirmOpen(false);
  };

  const confirmDeleteAccount = () => {
    api.delete('/settings/me/account').then(() => {
      setIsDeleteAccountConfirmOpen(false);
      showSaveMessage('Account deleted');
    }).catch(() => {
      setIsDeleteAccountConfirmOpen(false);
      showSaveMessage('Delete failed');
    });
  };

  const closeSubscriptionDialog = () => {
    setIsSubscriptionDialogOpen(false);
  };

  const openTwoFactorWizard = () => {
    setIsTwoFactorWizardOpen(true);
  };

  const closeTwoFactorWizard = () => {
    setIsTwoFactorWizardOpen(false);
  };

  const handleOpenProfile = () => {
    onNavigateProfile();
    navigate('/profile');
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = async () => {
    setIsLogoutConfirmOpen(false);
    try {
      await api.logout();
    } catch {
      // Ignore logout API failures and continue local sign-out.
    }

    [
      'auth_user_id',
      'auth_roles',
      'auth_email',
      'auth_name',
      'auth_access_token',
      'auth_session_token',
    ].forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
    localStorage.removeItem('auth_remember_token');
    navigate('/login', { replace: true });
  };

  const persistTwoFactorState = async (nextValue: boolean, successMessage: string) => {
    const previousValue = twoFactorEnabled;
    setTwoFactorEnabled(nextValue);

    try {
      setIsUpdatingTwoFactor(true);
      const data: any = await saveSettings({ twoFactorEnabled: nextValue });
      setTwoFactorEnabled(Boolean(data?.twoFactorEnabled));
      showSaveMessage(successMessage);
      return true;
    } catch {
      setTwoFactorEnabled(previousValue);
      showSaveMessage('Two-factor update failed');
      return false;
    } finally {
      setIsUpdatingTwoFactor(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    const nextValue = !twoFactorEnabled;
    await persistTwoFactorState(nextValue, nextValue ? 'Two-factor enabled' : 'Two-factor disabled');
  };

  const handleTwoFactorWizardSubmit = async () => {
    const nextValue = !twoFactorEnabled;
    const saved = await persistTwoFactorState(
      nextValue,
      nextValue ? 'Two-factor enabled from setup wizard' : 'Two-factor disabled from setup wizard',
    );
    if (saved) {
      setIsTwoFactorWizardOpen(false);
    }
  };

  const toggleSubscriptionRenewal = async () => {
    const nextAutoRenewEnabled = !subscription.autoRenewEnabled;

    try {
      setIsUpdatingSubscription(true);
      const data: any = await api.patch('/settings/me/subscription', { autoRenewEnabled: nextAutoRenewEnabled });
      setSubscription({
        planName: typeof data?.planName === 'string' ? data.planName : 'Premium Plan',
        autoRenewEnabled: Boolean(data?.autoRenewEnabled),
        renewingOn: typeof data?.renewingOn === 'string' || data?.renewingOn === null ? data.renewingOn : null,
      });
      setIsSubscriptionDialogOpen(false);
      showSaveMessage(nextAutoRenewEnabled ? 'Subscription renewal resumed' : 'Subscription renewal paused');
    } catch {
      showSaveMessage('Subscription update failed');
    } finally {
      setIsUpdatingSubscription(false);
    }
  };

  React.useEffect(() => {
    if (!sessionToDelete) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSessionToDelete(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sessionToDelete]);

  React.useEffect(() => {
    if (!isTwoFactorWizardOpen) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTwoFactorWizardOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isTwoFactorWizardOpen]);

  React.useEffect(() => {
    if (!isDeleteAccountConfirmOpen) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDeleteAccountConfirmOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDeleteAccountConfirmOpen]);

  React.useEffect(() => {
    if (!isLogoutAllConfirmOpen) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLogoutAllConfirmOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isLogoutAllConfirmOpen]);

  React.useEffect(
    () => () => {
      stopSoundPreview();
    },
    [stopSoundPreview]
  );

  const isDarkTheme =
    !isAdminView &&
    (themeMode === 'Dark' ||
      (themeMode === 'System' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  React.useEffect(() => {
    if (isAdminView) {
      applyTheme(false);
      if (themeMode !== 'Light') {
        setThemeMode('Light');
      }
      return;
    }

    setDarkModePreference(isDarkTheme);
  }, [isAdminView, isDarkTheme, themeMode]);
  const filteredLanguages = languageOptions.filter((item) =>
    item.toLowerCase().includes(languageSearch.trim().toLowerCase())
  );
  const adminHasUnsavedChanges =
    adminProfileSettings.title !== savedAdminProfileSettings.title ||
    adminProfileSettings.avatarUrl !== savedAdminProfileSettings.avatarUrl ||
    adminNotificationPreferences.systemUpdates !== savedAdminNotificationPreferences.systemUpdates ||
    adminNotificationPreferences.securityAlerts !== savedAdminNotificationPreferences.securityAlerts ||
    adminNotificationPreferences.orderPlacement !== savedAdminNotificationPreferences.orderPlacement ||
    adminNotificationPreferences.pushNotifications !== savedAdminNotificationPreferences.pushNotifications ||
    adminSystemSettings.shopName !== savedAdminSystemSettings.shopName ||
    adminSystemSettings.supportEmail !== savedAdminSystemSettings.supportEmail ||
    adminSystemSettings.currency !== savedAdminSystemSettings.currency;
  const adminNotificationRows = [
    {
      key: 'systemUpdates',
      title: 'System Updates',
      description: 'Maintenance and feature alerts.',
    },
    {
      key: 'securityAlerts',
      title: 'Security Alerts',
      description: 'Critical account safety notices.',
    },
    {
      key: 'orderPlacement',
      title: 'Order Placement',
      description: 'Email alerts for new orders.',
    },
    {
      key: 'pushNotifications',
      title: 'Push Notifications',
      description: 'Desktop alerts for urgent messages.',
    },
  ] as const;

  if (isAdminView) {
    return (
      <div className="settings-page admin-settings-screen">
        <style>{`
          :root {
            --bg: #f5f7fb;
            --panel: #ffffff;
            --line: #d6dfec;
            --muted: #72829b;
            --text: #18253d;
            --accent: #f48eb6;
            --accent-strong: #ef7aa8;
            --shadow-soft: 0 18px 46px rgba(148, 163, 184, 0.12);
          }

          .settings-page {
            min-height: 100vh;
            margin: 0;
            background:
              radial-gradient(circle at 100% 0%, rgba(244, 142, 182, 0.14), transparent 30%),
              radial-gradient(circle at 0% 12%, rgba(148, 197, 255, 0.2), transparent 28%),
              var(--bg);
            color: var(--text);
            font-family: 'Plus Jakarta Sans', Manrope, 'Segoe UI', sans-serif;
            font-size: 0.95rem;
            line-height: 1.45;
          }

          .admin-settings-shell {
            max-width: 1240px;
            margin: 0 auto;
            padding: 32px 24px 72px;
          }

          .admin-page-head {
            margin-bottom: 18px;
          }

          .admin-page-kicker {
            margin: 0 0 8px;
            color: #6d7f9a;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }

          .admin-page-title {
            margin: 0;
            font-size: 2rem;
            font-weight: 800;
            letter-spacing: -0.03em;
          }

          .admin-page-subtitle {
            margin: 10px 0 0;
            color: var(--muted);
            max-width: 740px;
          }

          .admin-panel {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 26px;
            box-shadow: var(--shadow-soft);
            padding: 28px 30px;
            margin-bottom: 18px;
          }

          .admin-section-title {
            margin: 0 0 22px;
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: -0.02em;
          }

          .admin-profile-layout {
            display: grid;
            grid-template-columns: 170px minmax(0, 1fr);
            gap: 28px;
            align-items: start;
          }

          .admin-avatar-column {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
          }

          .admin-avatar-frame {
            width: 154px;
            height: 154px;
            border-radius: 999px;
            border: 4px solid #fff;
            overflow: hidden;
            box-shadow: 0 14px 34px rgba(148, 163, 184, 0.2);
            background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
            padding: 0;
            cursor: pointer;
            position: relative;
            transition: transform 0.18s ease, box-shadow 0.18s ease;
          }

          .admin-avatar-frame:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 40px rgba(148, 163, 184, 0.26);
          }

          .admin-avatar-frame:focus-visible {
            outline: 3px solid rgba(37, 99, 235, 0.3);
            outline-offset: 3px;
          }

          .admin-avatar-frame:disabled {
            cursor: not-allowed;
            opacity: 0.7;
            transform: none;
          }

          .admin-avatar-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .admin-avatar-frame::after {
            content: 'Change photo';
            position: absolute;
            inset: auto 10px 10px;
            border-radius: 999px;
            padding: 7px 10px;
            background: rgba(15, 23, 42, 0.72);
            color: #fff;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.01em;
            opacity: 0;
            transform: translateY(8px);
            transition: opacity 0.18s ease, transform 0.18s ease;
            pointer-events: none;
          }

          .admin-avatar-frame:hover::after,
          .admin-avatar-frame:focus-visible::after {
            opacity: 1;
            transform: translateY(0);
          }

          .admin-avatar-btn,
          .admin-ghost-btn,
          .admin-outline-btn,
          .admin-primary-btn {
            height: 52px;
            border-radius: 18px;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
          }

          .admin-avatar-btn,
          .admin-ghost-btn,
          .admin-outline-btn {
            border: 1px solid var(--line);
            background: #fff;
            color: var(--text);
            padding: 0 18px;
          }

          .admin-avatar-btn:hover,
          .admin-ghost-btn:hover,
          .admin-outline-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(148, 163, 184, 0.14);
          }

          .admin-hidden-input {
            display: none;
          }

          .admin-profile-grid,
          .admin-system-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 18px;
          }

          .admin-system-grid {
            margin-top: 12px;
          }

          .admin-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .admin-field label {
            font-size: 0.72rem;
            font-weight: 700;
            color: #607089;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .admin-input {
            height: 52px;
            padding: 0 16px;
            border-radius: 18px;
            border: 1px solid var(--line);
            background: rgba(248, 250, 252, 0.92);
            color: var(--text);
            font: inherit;
          }

          .admin-input.read-only {
            color: #5f6f88;
            background: rgba(241, 245, 249, 0.92);
          }

          .admin-input:focus {
            outline: none;
            border-color: rgba(239, 122, 168, 0.7);
            box-shadow: 0 0 0 4px rgba(244, 142, 182, 0.18);
          }

          .admin-preferences-list {
            display: grid;
            gap: 18px;
          }

          .admin-pref-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 20px 18px;
            border: 1px solid var(--line);
            border-radius: 22px;
            background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96));
          }

          .admin-pref-title {
            margin: 0;
            font-size: 1rem;
            font-weight: 800;
          }

          .admin-pref-copy {
            margin: 6px 0 0;
            color: var(--muted);
          }

          .admin-toggle {
            position: relative;
            width: 74px;
            height: 38px;
            border: 1px solid #d3deea;
            border-radius: 999px;
            background: linear-gradient(180deg, #f8fbff 0%, #e6eef7 100%);
            cursor: pointer;
            flex-shrink: 0;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.92),
              0 10px 24px rgba(148, 163, 184, 0.16);
            transition: background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
          }

          .admin-toggle::before {
            content: 'OFF';
            position: absolute;
            top: 50%;
            right: 12px;
            transform: translateY(-50%);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.16em;
            color: #7b8ea8;
            transition: color 0.22s ease, transform 0.22s ease;
          }

          .admin-toggle::after {
            content: '';
            position: absolute;
            top: 4px;
            left: 4px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
            box-shadow:
              0 10px 18px rgba(15, 23, 42, 0.18),
              0 1px 2px rgba(15, 23, 42, 0.08);
            transition: transform 0.22s ease, box-shadow 0.22s ease;
          }

          .admin-toggle.on {
            border-color: #0f9f6e;
            background: linear-gradient(135deg, #0d9d69 0%, #16b97f 100%);
            box-shadow:
              0 14px 28px rgba(22, 185, 127, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.18);
          }

          .admin-toggle.on::before {
            content: 'ON';
            right: auto;
            left: 14px;
            color: rgba(255, 255, 255, 0.95);
          }

          .admin-toggle.on::after {
            transform: translateX(36px);
            box-shadow:
              0 12px 22px rgba(5, 73, 52, 0.22),
              0 1px 2px rgba(15, 23, 42, 0.08);
          }

          .admin-toggle:hover:not(:disabled) {
            transform: translateY(-1px);
          }

          .admin-toggle:focus-visible {
            outline: none;
            box-shadow:
              0 0 0 4px rgba(45, 212, 191, 0.2),
              0 14px 28px rgba(148, 163, 184, 0.18);
          }

          .admin-system-head {
            display: flex;
            align-items: start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 8px;
          }

          .admin-system-title {
            margin: 0;
            font-size: 1rem;
            font-weight: 800;
          }

          .admin-system-copy,
          .admin-system-meta,
          .admin-inline-status.muted {
            color: var(--muted);
          }

          .admin-system-copy {
            margin: 6px 0 0;
          }

          .admin-system-meta {
            margin-top: 14px;
            font-size: 0.9rem;
          }

          .admin-action-bar {
            position: sticky;
            bottom: 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 16px;
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid var(--line);
            border-radius: 24px;
            box-shadow: 0 18px 42px rgba(148, 163, 184, 0.18);
            backdrop-filter: blur(16px);
          }

          .admin-action-copy {
            min-height: 24px;
            display: flex;
            align-items: center;
          }

          .admin-action-buttons {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .admin-primary-btn {
            padding: 0 28px;
            border: none;
            background: linear-gradient(180deg, #f9a6ca, #ef7aa8);
            color: #fff;
            box-shadow: 0 18px 28px rgba(239, 122, 168, 0.28);
          }

          .admin-primary-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 20px 32px rgba(239, 122, 168, 0.34);
          }

          .admin-inline-status {
            font-weight: 600;
          }

          .admin-inline-status.error {
            color: #e11d48;
          }

          .admin-avatar-btn:disabled,
          .admin-ghost-btn:disabled,
          .admin-outline-btn:disabled,
          .admin-primary-btn:disabled,
          .admin-toggle:disabled {
            cursor: not-allowed;
            opacity: 0.6;
            transform: none;
            box-shadow: none;
          }

          @media (max-width: 900px) {
            .admin-profile-layout {
              grid-template-columns: 1fr;
            }

            .admin-avatar-column {
              align-items: flex-start;
            }

            .admin-action-bar,
            .admin-system-head,
            .admin-pref-row {
              flex-direction: column;
              align-items: stretch;
            }

            .admin-action-buttons {
              width: 100%;
              justify-content: stretch;
            }

            .admin-outline-btn,
            .admin-primary-btn {
              flex: 1;
            }
          }

          @media (max-width: 640px) {
            .admin-settings-shell {
              padding: 20px 16px 40px;
            }

            .admin-panel {
              padding: 22px 18px;
              border-radius: 22px;
            }

            .admin-page-title {
              font-size: 1.6rem;
            }
          }
        `}</style>

        <div className="admin-settings-shell">
          <header className="admin-page-head">
            <p className="admin-page-kicker">Admin Settings</p>
            <h1 className="admin-page-title">Profile & Notification Center</h1>
            <p className="admin-page-subtitle">
              Manage your admin identity, alert preferences, and BondKeeper store configuration from one place.
            </p>
          </header>

          <section className="admin-panel">
            <h2 className="admin-section-title">Profile</h2>
            <div className="admin-profile-layout">
              <div className="admin-avatar-column">
                <button
                  type="button"
                  className="admin-avatar-frame"
                  onClick={() => adminAvatarInputRef.current?.click()}
                  disabled={adminSettingsLoading || isAdminSaving}
                  aria-label="Change admin profile photo"
                  title="Change admin profile photo"
                >
                  <img
                    src={resolveApiAssetUrl(adminProfileSettings.avatarUrl || DEFAULT_AVATAR)}
                    alt={adminProfileSettings.title || DEFAULT_PROFILE_NAME}
                  />
                </button>
                <button
                  type="button"
                  className="admin-avatar-btn"
                  onClick={() => adminAvatarInputRef.current?.click()}
                  disabled={adminSettingsLoading || isAdminSaving}
                >
                  Edit photo
                </button>
                <input
                  ref={adminAvatarInputRef}
                  className="admin-hidden-input"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleAdminAvatarSelected}
                />
              </div>

              <div className="admin-profile-grid">
                <label className="admin-field" htmlFor="admin-full-name">
                  <span>Full Name</span>
                  <input
                    id="admin-full-name"
                    className="admin-input"
                    value={adminProfileSettings.title}
                    onChange={(event) =>
                      setAdminProfileSettings((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Admin name"
                  />
                </label>

                <label className="admin-field" htmlFor="admin-role">
                  <span>Role</span>
                  <input
                    id="admin-role"
                    className="admin-input read-only"
                    value={adminProfileSettings.role}
                    readOnly
                  />
                </label>

                <label className="admin-field" htmlFor="admin-email" style={{ gridColumn: '1 / -1' }}>
                  <span>Email</span>
                  <input
                    id="admin-email"
                    className="admin-input read-only"
                    type="email"
                    value={adminProfileSettings.email}
                    readOnly
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="admin-panel">
            <h2 className="admin-section-title">Notification Preferences</h2>
            <div className="admin-preferences-list">
              {adminNotificationRows.map((item) => (
                <article key={item.key} className="admin-pref-row">
                  <div>
                    <h3 className="admin-pref-title">{item.title}</h3>
                    <p className="admin-pref-copy">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    className={`admin-toggle ${adminNotificationPreferences[item.key] ? 'on' : ''}`}
                    aria-label={`Toggle ${item.title}`}
                    aria-pressed={adminNotificationPreferences[item.key]}
                    disabled={adminSettingsLoading || isAdminSaving}
                    onClick={() =>
                      setAdminNotificationPreferences((current) => ({
                        ...current,
                        [item.key]: !current[item.key],
                      }))
                    }
                  />
                </article>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-system-head">
              <div>
                <h2 className="admin-system-title">Store Configuration</h2>
                <p className="admin-system-copy">
                  Keep the existing backend-powered `system_settings` values editable here.
                </p>
              </div>
              <button
                type="button"
                className="admin-ghost-btn"
                onClick={() => {
                  setAdminSettingsLoading(true);
                  void loadAdminSystemSettings().finally(() => {
                    setAdminSettingsLoading(false);
                  });
                }}
                disabled={adminSettingsLoading || isAdminSaving}
              >
                {adminSettingsLoading ? 'Loading...' : 'Reload From DB'}
              </button>
            </div>

            <div className="admin-system-grid">
              <label className="admin-field" htmlFor="shop-name">
                <span>Shop Name</span>
                <input
                  id="shop-name"
                  className="admin-input"
                  value={adminSystemSettings.shopName}
                  onChange={(event) =>
                    setAdminSystemSettings((current) => ({
                      ...current,
                      shopName: event.target.value,
                    }))
                  }
                  placeholder="BondKeeper"
                />
              </label>

              <label className="admin-field" htmlFor="support-email">
                <span>Support Email</span>
                <input
                  id="support-email"
                  className="admin-input"
                  type="email"
                  value={adminSystemSettings.supportEmail}
                  onChange={(event) =>
                    setAdminSystemSettings((current) => ({
                      ...current,
                      supportEmail: event.target.value,
                    }))
                  }
                  placeholder="support@example.com"
                />
              </label>

              <label className="admin-field" htmlFor="currency">
                <span>Currency</span>
                <input
                  id="currency"
                  className="admin-input"
                  value={adminSystemSettings.currency}
                  onChange={(event) =>
                    setAdminSystemSettings((current) => ({
                      ...current,
                      currency: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="USD"
                  maxLength={10}
                />
              </label>
            </div>

            <p className="admin-system-meta">
              {adminSystemSettings.updatedAt
                ? `Last updated: ${formatNotificationDate(adminSystemSettings.updatedAt)}`
                : 'No saved system settings timestamp yet.'}
            </p>
          </section>

          <div className="admin-action-bar">
            <div className="admin-action-copy">
              {adminSettingsError ? (
                <span className="admin-inline-status error">{adminSettingsError}</span>
              ) : saveMessage ? (
                <span className="admin-inline-status">{saveMessage}</span>
              ) : (
                <span className="admin-inline-status muted">
                  {adminHasUnsavedChanges ? 'Unsaved changes ready to save.' : 'All changes are saved.'}
                </span>
              )}
            </div>

            <div className="admin-action-buttons">
              <button
                type="button"
                className="admin-outline-btn"
                onClick={handleDiscardAdminChanges}
                disabled={!adminHasUnsavedChanges || adminSettingsLoading || isAdminSaving}
              >
                Discard
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => {
                  void handleSaveAdminSettings();
                }}
                disabled={adminSettingsLoading || isAdminSaving}
              >
                {isAdminSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`settings-page ${isDarkTheme ? 'dark' : ''}`}>
      <style>{`
        :root {
          --bg: #f4f7fb;
          --panel: #ffffff;
          --line: #dfe6f0;
          --muted: #6e7f98;
          --text: #14213d;
          --accent: #e93f66;
          --accent-strong: #d93359;
          --accent-soft: #fff1f5;
          --success: #d8f7e3;
          --radius-lg: 24px;
          --radius-md: 16px;
          --shadow-soft: 0 8px 28px rgba(15, 23, 42, 0.07);
          --shadow-card: 0 10px 34px rgba(15, 23, 42, 0.06);
          --gradient-accent: linear-gradient(180deg, #ef4d73, #d8345a);
        }

        * {
          box-sizing: border-box;
        }

        .settings-page {
          min-height: 100vh;
          margin: 0;
          background:
            radial-gradient(circle at 100% -10%, rgba(233, 63, 102, 0.08), transparent 38%),
            radial-gradient(circle at -8% 8%, rgba(80, 124, 232, 0.08), transparent 33%),
            var(--bg);
          color: var(--text);
          font-family: 'Plus Jakarta Sans', Manrope, 'Segoe UI', sans-serif;
          line-height: 1.45;
          letter-spacing: -0.01em;
        }

        .settings-page.dark {
          --bg: #111827;
          --panel: #1f2937;
          --line: #374151;
          --muted: #9ca3af;
          --text: #f3f4f6;
          --accent-soft: #3b1f29;
          --success: #1b3a2a;
          --shadow-soft: 0 14px 40px rgba(2, 6, 23, 0.42);
          --shadow-card: 0 16px 46px rgba(2, 6, 23, 0.46);
        }

        .settings-page.dark .topbar,
        .settings-page.dark .general-card,
        .settings-page.dark .card,
        .settings-page.dark .danger-card,
        .settings-page.dark .premium-card,
        .settings-page.dark .help-card,
        .settings-page.dark .sound-row,
        .settings-page.dark .email-card,
        .settings-page.dark .dnd-card {
          background: var(--panel);
          border-color: var(--line);
        }

        .settings-page.dark .notification-panel {
          background: #111827;
          border-color: #243244;
          box-shadow: 0 20px 40px rgba(2, 6, 23, 0.6);
        }

        .settings-page.dark .notification-head {
          border-color: #243244;
        }

        .settings-page.dark .notification-mark {
          color: #fb7185;
        }

        .settings-page.dark .notification-title,
        .settings-page.dark .notification-item-title {
          color: #e5e7eb;
        }

        .settings-page.dark .notification-item-copy,
        .settings-page.dark .notification-time,
        .settings-page.dark .notification-footer {
          color: #94a3b8;
        }

        .settings-page.dark .notification-item + .notification-item {
          border-color: #1f2937;
        }

        .settings-page.dark .notification-list {
          scrollbar-color: #334155 transparent;
        }

        .settings-page.dark .notification-list::-webkit-scrollbar-thumb {
          background: #334155;
        }

        .settings-page.dark .setting-row,
        .settings-page.dark .theme-switch,
        .settings-page.dark .search-input,
        .settings-page.dark .device,
        .settings-page.dark .info-box,
        .settings-page.dark .data-box,
        .settings-page.dark .dnd-time,
        .settings-page.dark .content-head {
          background: #253244;
          border-color: var(--line);
          color: var(--text);
        }

        .settings-page.dark .heading,
        .settings-page.dark .general-heading,
        .settings-page.dark .danger-title,
        .settings-page.dark .session-name,
        .settings-page.dark h3,
        .settings-page.dark h4,
        .settings-page.dark .brand-text {
          color: var(--text);
        }

        .settings-page.dark .subheading,
        .settings-page.dark .general-subheading,
        .settings-page.dark .setting-sub,
        .settings-page.dark .crumbs,
        .settings-page.dark p {
          color: var(--muted);
        }

        .settings-page.dark .theme-switch button.active {
          background: #374151;
          color: #f9a8b8;
        }

        .topbar {
          height: 72px;
          border-bottom: 1px solid #ece7ed;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          position: sticky;
          top: 0;
          z-index: 15;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .brand-logo {
          color: #f542a7;
          font-size: 21px;
        }

        .brand-text {
          color: #f542a7;
          font-size: 26px;
          font-weight: 600;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .main-nav {
          flex: 1;
          display: flex;
          gap: 22px;
          justify-content: center;
        }

        .main-nav button {
          border: 0;
          background: transparent;
          color: #27272a;
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          padding: 6px 0;
          white-space: nowrap;
          transition: color 0.18s ease;
        }

        .main-nav button:hover {
          color: #f542a7;
        }

        .main-nav button.active {
          color: #ef2f5a;
          font-weight: 700;
        }

        .main-nav button.active::after {
          content: none;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .top-icon {
          color: #27272a;
        }

        .icon-btn {
          border: 0;
          background: transparent;
          padding: 0;
          cursor: pointer;
          width: auto;
          height: auto;
          border-radius: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 0.18s ease;
        }

        .icon-btn:hover {
          color: #f542a7;
        }

        .notification-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .notification-btn {
          border: 0;
          background: transparent;
          padding: 0;
          cursor: pointer;
          color: #27272a;
          font-size: 22px;
          line-height: 1;
          position: relative;
          width: auto;
          height: auto;
          border-radius: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 0.18s ease;
        }

        .notification-btn:hover {
          color: #f542a7;
        }

        .notification-btn-badge {
          position: absolute;
          top: 2px;
          right: -1px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef2f5a;
          border: 1.5px solid #f4f5f7;
        }

        .notification-panel {
          position: absolute;
          right: -6px;
          top: calc(100% + 10px);
          width: min(332px, 92vw);
          background: #fff;
          border: 1px solid #e8edf5;
          border-radius: 16px;
          box-shadow: 0 24px 40px rgba(30, 42, 62, 0.16);
          overflow: hidden;
          z-index: 40;
          animation: panelIn 0.18s ease;
        }


        .notification-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 12px;
          border-bottom: 1px solid #edf1f7;
        }

        .notification-title {
          margin: 0;
          color: #8ea0b9;
          font-size: 28px;
          letter-spacing: -0.03em;
          font-weight: 900;
          line-height: 1;
        }

        .notification-mark {
          border: 0;
          background: transparent;
          color: #ef2f5a;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          padding: 0;
        }

        .notification-list {
          padding: 6px 8px;
          max-height: 360px;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: #c8d2e0 transparent;
        }

        .notification-list::-webkit-scrollbar {
          width: 8px;
        }

        .notification-list::-webkit-scrollbar-thumb {
          background: #c8d2e0;
          border-radius: 999px;
        }

        .notification-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .notification-item {
          border: 0;
          width: 100%;
          text-align: left;
          background: transparent;
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr) 8px;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 10px;
          border-radius: 10px;
          transition: background 0.2s ease;
          cursor: pointer;
          font-family: inherit;
        }

        .notification-item:hover {
          background: #f8fbff;
        }

        .notification-item + .notification-item {
          border-top: 1px solid #f2f5fa;
        }

        .notification-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 14px;
          color: #284367;
          font-weight: 700;
          margin-top: 2px;
        }

        .notification-icon.image {
          background: #e7eeff;
          color: #3f68d7;
        }

        .notification-icon.calendar {
          background: #ffe8ef;
          color: #ea456f;
        }

        .notification-icon.gift {
          background: #fff5d8;
          color: #c99411;
        }

        .notification-icon.system {
          background: #e9edf3;
          color: #556c87;
        }

        .notification-item-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: #5f718d;
          line-height: 1.25;
        }

        .notification-item-copy {
          margin: 4px 0 0;
          color: #8ea0b7;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 600;
        }

        .notification-time {
          margin-top: 8px;
          color: #b0bcce;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .notification-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef2f5a;
          margin-top: 11px;
        }

        .notification-footer {
          border-top: 1px solid #edf1f7;
          text-align: center;
          padding: 12px;
          color: #647790;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .session-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 70;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(3px);
        }

        .session-confirm-dialog {
          width: min(420px, 100%);
          border-radius: 18px;
          border: 1px solid #dbe4f1;
          background: #fff;
          box-shadow: 0 24px 44px rgba(15, 23, 42, 0.24);
          padding: 20px;
        }

        .session-confirm-title {
          margin: 0;
          color: #12213f;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .session-confirm-copy {
          margin: 8px 0 0;
          color: #5f7695;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 600;
        }

        .session-confirm-actions {
          margin-top: 18px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .session-confirm-btn {
          min-width: 88px;
          height: 40px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .session-confirm-btn.cancel {
          border: 1px solid #d2deed;
          background: #f3f8fd;
          color: #536b89;
        }

        .session-confirm-btn.ok {
          border: 0;
          background: var(--gradient-accent);
          color: #fff;
          box-shadow: 0 8px 18px rgba(233, 63, 102, 0.24);
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #efedf1;
          object-fit: cover;
          cursor: pointer;
        }

        .divider {
          width: 1px;
          height: 32px;
          background: #e7e4ea;
        }

        .profile-name {
          font-size: 14px;
          font-weight: 500;
          color: #27272a;
        }

        .page-body {
          max-width: 1380px;
          margin: 0 auto;
          padding: 34px 24px 34px;
          display: grid;
          grid-template-columns: 290px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .sidebar {
          min-height: 900px;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--line);
          border-radius: 28px;
          background:
            radial-gradient(circle at top, rgba(236, 72, 153, 0.08), transparent 34%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.96));
          box-shadow: 0 20px 42px rgba(15, 23, 42, 0.08);
          padding: 24px 20px;
          position: sticky;
          top: 96px;
          overflow: hidden;
        }

        .sidebar-title {
          margin: 0 0 18px;
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9aaac0;
          font-weight: 900;
        }

        .menu-list {
          display: grid;
          gap: 10px;
        }

        .menu-btn {
          width: 100%;
          border: 1px solid #e4ebf3;
          background: #fff;
          border-radius: 12px;
          height: 46px;
          padding: 0 14px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 700;
          color: #30445f;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .menu-btn:hover {
          border-color: #cfd9e6;
          background: #f8fbff;
          transform: translateY(-1px);
        }

        .menu-btn span:first-child {
          font-size: 17px;
          line-height: 1;
        }

        .menu-btn.active {
          color: #fff;
          border-color: transparent;
          background: linear-gradient(180deg, #ee4a6f, #db3158);
          box-shadow: 0 10px 20px rgba(240, 50, 85, 0.25);
        }

        .premium-card {
          margin-top: auto;
          border: 1px solid #f1d5db;
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(240, 50, 85, 0.12), transparent 42%),
            linear-gradient(170deg, #fff8fb, #fff2f6);
          padding: 20px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sidebar-profile-avatar {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.92);
          box-shadow: 0 14px 28px rgba(233, 63, 102, 0.14);
          background: #fff;
        }

        .sidebar-profile-meta {
          min-width: 0;
        }

        .sidebar-profile-meta h4 {
          margin: 0;
          font-size: 17px;
          color: #d93a61;
          font-weight: 900;
          line-height: 1.15;
        }

        .sidebar-profile-meta p {
          margin: 6px 0 0;
          color: #7f91aa;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.35;
          word-break: break-word;
        }

        .sidebar-card-actions {
          margin-top: 18px;
          display: grid;
          gap: 10px;
        }

        .sidebar-profile-btn,
        .sidebar-logout-btn {
          width: 100%;
          min-height: 42px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .sidebar-profile-btn {
          border: 1px solid #f1c2ce;
          background: rgba(255, 255, 255, 0.86);
          color: #d93a61;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95);
        }

        .sidebar-profile-btn:hover {
          transform: translateY(-1px);
          border-color: #ea9eb0;
          background: #fff;
        }

        .sidebar-logout-btn {
          border: 0;
          background: var(--gradient-accent);
          color: #fff;
          box-shadow: 0 10px 22px rgba(233, 63, 102, 0.24);
        }

        .sidebar-logout-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 26px rgba(233, 63, 102, 0.3);
        }

        .content {
          min-width: 0;
          display: grid;
          align-content: start;
        }

        .content-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 28px;
          padding: 22px 24px;
          border: 1px solid rgba(220, 229, 240, 0.9);
          border-radius: 32px;
          background:
            radial-gradient(circle at top right, rgba(236, 72, 153, 0.12), transparent 34%),
            radial-gradient(circle at left center, rgba(125, 211, 252, 0.1), transparent 30%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 255, 0.96));
          box-shadow: 0 20px 44px rgba(15, 23, 42, 0.08);
          position: relative;
          overflow: hidden;
        }

        .head-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .save-message {
          color: var(--accent);
          font-size: 13px;
          font-weight: 800;
          min-width: 120px;
          letter-spacing: 0.01em;
        }

        .ghost-btn {
          border: 1px solid #d9e0eb;
          height: 42px;
          border-radius: 999px;
          padding: 0 24px;
          background: #f4f7fb;
          color: #5a6b86;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: inset 0 0 0 1px #eef3f9;
        }

        .ghost-btn:hover {
          border-color: #c7d3e2;
          background: #edf3fa;
          color: #30445f;
        }

        .save-btn {
          border: 0;
          height: 42px;
          border-radius: 999px;
          padding: 0 28px;
          background: var(--gradient-accent);
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 8px 18px rgba(240, 50, 85, 0.24);
          cursor: pointer;
        }

        .save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(233, 63, 102, 0.32);
        }

        .crumbs {
          margin: 2px 0 8px;
          color: #8292ac;
          font-size: 16px;
          font-weight: 700;
        }

        .crumbs strong {
          color: #253551;
          font-weight: 800;
        }

        .heading {
          margin: 0;
          font-size: clamp(30px, 3.4vw, 42px);
          letter-spacing: -0.03em;
          line-height: 1.1;
          font-weight: 800;
          color: #131f37;
        }

        .subheading {
          margin: 10px 0 28px;
          max-width: 760px;
          color: #69809f;
          font-size: 14px;
          line-height: 1.42;
          font-weight: 600;
        }

        .general-heading {
          margin: 0;
          font-size: clamp(24px, 2.3vw, 34px);
          letter-spacing: -0.04em;
          line-height: 1.02;
          font-weight: 800;
          color: #131f37;
          text-wrap: balance;
        }

        .general-subheading {
          margin: 10px 0 0;
          max-width: 560px;
          color: #6b7f98;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 600;
        }

        .general-stack {
          display: grid;
          gap: 24px;
        }

        .general-card {
          border: 1px solid var(--line);
          border-radius: 28px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 252, 255, 0.98));
          padding: 26px;
          box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .general-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 46px rgba(15, 23, 42, 0.11);
          border-color: #d9e3ef;
        }

        .general-card h3 {
          margin: 0;
          font-size: 19px;
          color: #162540;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .general-icon {
          color: var(--accent);
          margin-right: 8px;
          font-size: 18px;
        }

        .theme-switch {
          margin-top: 18px;
          width: min(100%, 620px);
          background: #eaf0f8;
          border-radius: 999px;
          padding: 6px;
          display: flex;
          gap: 6px;
        }

        .theme-switch button {
          border: 0;
          background: transparent;
          color: #60728e;
          border-radius: 999px;
          height: 44px;
          min-width: 130px;
          padding: 0 16px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .theme-switch button.active {
          background: #fff;
          color: var(--accent);
          box-shadow: 0 6px 16px rgba(16, 30, 54, 0.1);
        }

        .setting-row {
          margin-top: 16px;
          background: linear-gradient(180deg, #fbfdff, #f6f9fd);
          border: 1px solid #e7edf5;
          border-radius: 18px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
        }

        .setting-row + .setting-row {
          margin-top: 12px;
        }

        .setting-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .setting-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #fff;
          display: grid;
          place-items: center;
          color: var(--accent);
          font-size: 20px;
          box-shadow: 0 1px 4px rgba(16, 31, 54, 0.08);
          flex: 0 0 auto;
        }

        .setting-title {
          margin: 0;
          color: #1a2842;
          font-size: 16px;
          font-weight: 800;
        }

        .setting-sub {
          margin: 2px 0 0;
          color: #7387a2;
          font-size: 14px;
          font-weight: 600;
        }

        .general-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 24px;
          align-items: stretch;
        }

        .search-input {
          margin-top: 18px;
          height: 48px;
          border: 1px solid #d9e3ef;
          width: 100%;
          border-radius: 999px;
          background: #f7faff;
          color: #7d8ea8;
          font-size: 15px;
          font-weight: 600;
          padding: 0 16px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-input:focus {
          border-color: #99afd0;
          box-shadow: 0 0 0 3px rgba(153, 175, 208, 0.2);
        }

        .language-list {
          margin-top: 14px;
          display: grid;
          gap: 10px;
        }

        .language-btn {
          border: 1px solid #edf2f8;
          background: linear-gradient(180deg, #fbfdff, #f4f8fd);
          color: #6d7f99;
          font-size: 16px;
          font-weight: 700;
          text-align: left;
          border-radius: 16px;
          padding: 14px 14px;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .language-btn:hover {
          border-color: #d9e3ef;
          background: #f1f6fd;
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
        }

        .language-btn.active {
          background: linear-gradient(180deg, #fff2f6, #ffecef);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-color: #f7c2cf;
          box-shadow: 0 14px 28px rgba(240, 50, 85, 0.12);
        }

        .language-empty {
          color: #6d7f99;
          font-size: 14px;
          font-weight: 600;
          padding: 8px 12px;
        }

        .data-card-panel {
          background:
            radial-gradient(circle at top right, rgba(240, 50, 85, 0.1), transparent 34%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 248, 251, 0.98));
          border-color: #f2d9e0;
        }

        .data-card-intro {
          margin: 10px 0 0;
          color: #7a8ea7;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
          max-width: 460px;
        }

        .data-box {
          margin-top: 18px;
          border: 1px solid #f6c9d4;
          border-radius: 28px;
          padding: 22px 22px 18px;
          background:
            radial-gradient(circle at top right, rgba(240, 50, 85, 0.14), transparent 32%),
            linear-gradient(180deg, #fffafb, #fffdfd);
          box-shadow:
            inset 0 0 0 1px #ffe6ec,
            0 18px 34px rgba(240, 50, 85, 0.08);
        }

        .data-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .data-copy {
          min-width: 0;
        }

        .data-toggle-shell {
          flex: 0 0 auto;
          position: relative;
          padding: 7px;
          border-radius: 999px;
          background:
            radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.98), rgba(255, 244, 248, 0.94) 58%, rgba(252, 239, 245, 0.96)),
            linear-gradient(180deg, #fff9fb, #fdf2f6);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.98),
            inset 0 -1px 0 rgba(246, 202, 215, 0.35),
            0 10px 20px rgba(240, 50, 85, 0.08);
        }

        .data-toggle-shell::before {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.64), rgba(255, 255, 255, 0));
          pointer-events: none;
        }

        .data-toggle-shell .toggle {
          width: 64px;
          height: 36px;
          border: 0;
          background:
            linear-gradient(180deg, #f9d7e3, #f4c7d7);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.7),
            0 6px 16px rgba(240, 50, 85, 0.12);
          overflow: hidden;
        }

        .data-toggle-shell .toggle::after {
          top: 3px;
          left: 3px;
          width: 28px;
          height: 28px;
          background: linear-gradient(180deg, #ffffff, #fffafb);
          box-shadow:
            0 10px 18px rgba(20, 32, 54, 0.12),
            0 2px 4px rgba(20, 32, 54, 0.08);
        }

        .data-toggle-shell .toggle.on {
          background:
            radial-gradient(circle at 78% 28%, rgba(255, 144, 181, 0.24), transparent 24%),
            linear-gradient(135deg, #f24773, #eb3f79 55%, #d9367e);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.18),
            0 12px 22px rgba(233, 63, 102, 0.24);
        }

        .data-toggle-shell .toggle.on::after {
          transform: translateX(28px);
        }

        .data-toggle-shell .toggle:hover:not(:disabled) {
          transform: none;
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.72),
            0 8px 18px rgba(240, 50, 85, 0.14);
        }

        .data-toggle-shell .toggle.on:hover:not(:disabled) {
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.2),
            0 14px 24px rgba(233, 63, 102, 0.28);
        }

        .data-toggle-shell .toggle:focus-visible {
          box-shadow:
            0 0 0 4px rgba(244, 114, 182, 0.18),
            inset 0 1px 1px rgba(255, 255, 255, 0.72),
            0 8px 18px rgba(240, 50, 85, 0.14);
        }

        .data-top h4 {
          margin: 0;
          color: #1b2a45;
          font-size: 17px;
          letter-spacing: -0.02em;
        }

        .data-top p {
          margin: 10px 0 0;
          color: #7286a1;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 600;
          max-width: 390px;
        }

        .sync-meta {
          margin-top: 16px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 999px;
          border: 1px solid #ffd8e2;
        }

        .sync-meta.is-pending {
          background: rgba(255, 236, 241, 0.92);
          color: var(--accent);
        }

        .sync-meta.is-synced {
          background: rgba(236, 253, 245, 0.95);
          border-color: #b7efd0;
          color: #19945f;
        }

        .data-actions {
          margin-top: 16px;
          display: grid;
          gap: 10px;
        }

        .download-btn {
          width: 100%;
          border: 1px solid transparent;
          background: linear-gradient(135deg, #ef426d, #e83375 55%, #dc2f79);
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          text-align: center;
          cursor: pointer;
          padding: 15px 18px;
          border-radius: 20px;
          letter-spacing: 0.01em;
          box-shadow: 0 16px 30px rgba(233, 63, 102, 0.24);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }

        .download-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 20px 34px rgba(233, 63, 102, 0.3);
          filter: saturate(1.05);
        }

        .data-note {
          margin: 0;
          color: #8a9bb1;
          font-size: 12px;
          line-height: 1.5;
          font-weight: 600;
          text-align: center;
        }

        .language-card,
        .data-card-panel {
          height: 100%;
        }

        .ghost-btn:disabled,
        .save-btn:disabled,
        .download-btn:disabled,
        .export-btn:disabled,
        .help-save-btn:disabled,
        .premium-card button:disabled,
        .wizard-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
          box-shadow: none;
        }

        .toggle:disabled {
          cursor: not-allowed;
          opacity: 0.75;
        }

        .danger-card {
          border: 1px solid #f4d6dd;
          border-radius: var(--radius-md);
          background: linear-gradient(180deg, #ffffff, #fff8fa);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          box-shadow: var(--shadow-card);
        }

        .danger-title {
          margin: 0;
          color: var(--accent);
          font-size: 32px;
          letter-spacing: -0.02em;
          font-weight: 800;
        }

        .danger-sub {
          margin: 6px 0 0;
          color: #7d8fa8;
          font-size: 17px;
          font-weight: 600;
        }

        .danger-btn {
          border: 1px solid #f3b8c4;
          background: #fff;
          color: var(--accent);
          border-radius: 999px;
          height: 44px;
          padding: 0 26px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 24px;
          align-items: start;
        }

        .left-stack,
        .right-stack {
          display: grid;
          gap: 24px;
        }

        .card {
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          background: var(--panel);
          box-shadow: var(--shadow-card);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.11);
          border-color: #d5dfeb;
        }

        .two-factor {
          padding: 26px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .inline {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .shield {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #fff2f5;
          color: var(--accent);
          display: grid;
          place-items: center;
          font-size: 22px;
        }

        .two-factor h3,
        .sessions h3,
        .side-panel h3 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -0.02em;
          color: #1a2742;
        }

        .two-factor p {
          margin: 4px 0 0;
          color: #7084a0;
          font-size: 14px;
          line-height: 1.35;
          max-width: 520px;
        }

        .action-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle {
          width: 76px;
          height: 38px;
          border: 1px solid #d7e3ed;
          border-radius: 999px;
          background: linear-gradient(180deg, #f8fbff 0%, #e8eff7 100%);
          position: relative;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.96),
            0 10px 24px rgba(148, 163, 184, 0.16);
          transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .toggle::before {
          content: 'OFF';
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: #8194ad;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .toggle::after {
          content: '';
          position: absolute;
          top: 4px;
          left: 4px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(180deg, #ffffff, #f8fbff);
          box-shadow:
            0 10px 18px rgba(20, 32, 54, 0.14),
            0 1px 2px rgba(20, 32, 54, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .toggle.on {
          background: linear-gradient(135deg, #0d9d69 0%, #15b77d 55%, #19c08a 100%);
          border-color: #0f9f6e;
          box-shadow:
            0 14px 28px rgba(22, 185, 127, 0.24),
            inset 0 1px 1px rgba(255, 255, 255, 0.18);
        }

        .toggle.on::before {
          content: 'ON';
          right: auto;
          left: 14px;
          color: rgba(255, 255, 255, 0.95);
        }

        .toggle.on::after {
          transform: translateX(40px);
          box-shadow:
            0 12px 20px rgba(7, 86, 61, 0.2),
            0 1px 2px rgba(20, 32, 54, 0.1);
        }

        .toggle:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #c5d0e0;
          box-shadow:
            0 10px 18px rgba(148, 163, 184, 0.12),
            inset 0 1px 1px rgba(255, 255, 255, 0.92);
        }

        .toggle.on:hover:not(:disabled) {
          border-color: #119868;
          box-shadow:
            0 16px 28px rgba(22, 185, 127, 0.28),
            inset 0 1px 1px rgba(255, 255, 255, 0.2);
        }

        .toggle:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 4px rgba(45, 212, 191, 0.2),
            inset 0 1px 1px rgba(255, 255, 255, 0.92);
        }

        .wizard-btn {
          border: 0;
          height: 46px;
          border-radius: 999px;
          padding: 0 20px;
          background: var(--gradient-accent);
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(233, 63, 102, 0.23);
        }

        .wizard-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 26px rgba(233, 63, 102, 0.3);
        }

        .sessions {
          padding: 24px 24px 14px;
        }

        .sessions-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .logout-link {
          border: 0;
          background: transparent;
          color: var(--accent);
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .session-item {
          padding: 18px 4px;
          border-top: 1px solid #ebeff5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .session-item:first-of-type {
          border-top: 0;
        }

        .session-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .device {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #edf2f8;
          color: #647892;
          display: grid;
          place-items: center;
          font-size: 18px;
        }

        .session-name {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #1a2742;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .badge {
          border-radius: 999px;
          background: var(--success);
          color: #38a764;
          font-size: 11px;
          font-weight: 900;
          padding: 2px 9px;
          letter-spacing: 0.03em;
        }

        .session-meta {
          margin: 4px 0 0;
          color: #7b8da8;
          font-size: 15px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .open-btn {
          border: 0;
          background: transparent;
          color: #8ea1ba;
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
          padding: 6px;
        }

        .side-panel {
          padding: 24px;
        }

        .side-panel p {
          margin: 10px 0 0;
          color: #7285a0;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
        }

        .vault-scale {
          margin-top: 20px;
        }

        .scale-line {
          height: 6px;
          border-radius: 999px;
          background: #e0e7f0;
          position: relative;
        }

        .scale-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent);
          position: absolute;
          top: 50%;
          left: 59%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 0 4px rgba(240, 50, 85, 0.15);
        }

        .scale-tabs {
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .scale-tabs button {
          border: 0;
          background: transparent;
          color: #a0afc2;
          font-size: 11px;
          letter-spacing: 0.08em;
          font-weight: 800;
          text-transform: uppercase;
          cursor: pointer;
          padding: 0;
        }

        .scale-tabs button.active {
          color: var(--accent);
        }

        .info-box {
          margin-top: 18px;
          border: 1px solid #e9edf3;
          border-radius: 20px;
          background: #f9fbfe;
          padding: 12px 13px 12px 14px;
          color: #7d8ea8;
          font-size: 14px;
          line-height: 1.46;
          font-weight: 600;
        }

        .data-card {
          border-color: #f0d0d6;
          background: #fff8f9;
        }

        .export-btn {
          margin-top: 20px;
          width: 100%;
          height: 46px;
          border-radius: 999px;
          border: 1px solid #efc5cf;
          background: #fff;
          color: var(--accent);
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
        }

        .last-export {
          margin-top: 14px;
          text-align: center;
          color: #a6b4c7;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .security-screen {
          position: relative;
          padding: 18px 18px 20px;
          border-radius: 32px;
          border: 1px solid rgba(217, 227, 239, 0.92);
          background:
            radial-gradient(circle at 100% 0, rgba(59, 130, 246, 0.1), transparent 38%),
            radial-gradient(circle at 0 100%, rgba(233, 63, 102, 0.1), transparent 36%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(247, 250, 255, 0.94));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            0 20px 44px rgba(24, 43, 74, 0.08);
          overflow: hidden;
        }

        .security-screen .crumbs {
          margin-bottom: 12px;
          color: #6f819d;
          letter-spacing: 0.01em;
        }

        .security-screen .heading {
          font-size: clamp(28px, 2.5vw, 34px);
          line-height: 1.02;
          letter-spacing: -0.032em;
          margin-bottom: 8px;
          color: #10213f;
          text-wrap: balance;
        }

        .security-screen .subheading {
          margin: 0 0 24px;
          max-width: 760px;
          color: #607696;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 600;
        }

        .security-screen .main-grid {
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 24px;
        }

        .security-screen .left-stack,
        .security-screen .right-stack {
          gap: 18px;
        }

        .security-screen .card {
          border: 1px solid #dce6f2;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.98));
          box-shadow: 0 18px 36px rgba(30, 53, 96, 0.09);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          overflow: hidden;
        }

        .security-screen .card:hover {
          transform: translateY(-2px);
          border-color: #d0ddec;
          box-shadow: 0 24px 42px rgba(23, 44, 82, 0.14);
        }

        .security-screen .two-factor {
          padding: 28px 28px;
          align-items: center;
          gap: 24px;
          border: 1px solid #d9e4f2;
          border-radius: 26px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 30%),
            linear-gradient(180deg, #ffffff, #f7faff),
            linear-gradient(90deg, rgba(233, 63, 102, 0.08), rgba(59, 130, 246, 0.05));
          box-shadow: 0 18px 34px rgba(20, 38, 68, 0.1);
        }

        .security-screen .two-factor .inline {
          flex: 1 1 auto;
          min-width: 0;
          align-items: flex-start;
          gap: 14px;
        }

        .security-screen .shield {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(180deg, #fff1f6, #ffe7ee);
          box-shadow: inset 0 0 0 1px #ffc9d6, 0 10px 18px rgba(233, 63, 102, 0.16);
        }

        .security-screen .two-factor h3,
        .security-screen .sessions h3,
        .security-screen .side-panel h3 {
          font-size: 18px;
          color: #12213f;
          letter-spacing: -0.018em;
        }

        .security-screen .two-factor p {
          margin-top: 6px;
          color: #5a7292;
          font-size: 15px;
          line-height: 1.5;
          max-width: 560px;
        }

        .security-screen .two-factor-status {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 1px solid #d9e4f2;
          background: #f8fbff;
          color: #68809f;
        }

        .security-screen .two-factor-status::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .security-screen .two-factor-status.enabled {
          border-color: #b8ebcc;
          background: #effcf4;
          color: #1f8b4e;
        }

        .security-screen .two-factor-status.disabled {
          border-color: #f2d6dd;
          background: #fff6f8;
          color: #c15b76;
        }

        .security-screen .action-row {
          gap: 14px;
          align-self: center;
          flex: 0 0 auto;
        }

        .security-screen .toggle {
          width: 52px;
          height: 30px;
          border: 1px solid #cfd9e8;
          background: #e6edf7;
          box-shadow: inset 0 0 0 1px #dde6f3;
        }

        .security-screen .toggle.on {
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 8px 16px rgba(233, 63, 102, 0.25);
        }

        .security-screen .toggle::after {
          width: 24px;
          height: 24px;
        }

        .security-screen .toggle.on::after {
          transform: translateX(22px);
        }

        .security-screen .wizard-btn {
          height: 50px;
          min-width: 154px;
          padding: 0 24px;
          border-radius: 999px;
          background: linear-gradient(180deg, #f14f75, #dc345b);
          font-size: 14px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: 0.01em;
          box-shadow: 0 12px 24px rgba(233, 63, 102, 0.28);
        }

        .security-screen .wizard-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 28px rgba(233, 63, 102, 0.34);
        }

        .two-factor-wizard {
          width: min(520px, 100%);
          border-radius: 24px;
          border: 1px solid #dbe4f1;
          background:
            radial-gradient(circle at top right, rgba(240, 50, 85, 0.08), transparent 34%),
            linear-gradient(180deg, #ffffff, #f9fbff);
          box-shadow: 0 28px 56px rgba(15, 23, 42, 0.22);
          padding: 24px;
        }

        .two-factor-wizard-head {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .two-factor-wizard-icon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          background: linear-gradient(180deg, #fff1f6, #ffe7ee);
          color: var(--accent);
          display: grid;
          place-items: center;
          font-size: 24px;
          box-shadow: inset 0 0 0 1px #ffc9d6, 0 10px 18px rgba(233, 63, 102, 0.14);
          flex: 0 0 auto;
        }

        .two-factor-wizard-title {
          margin: 0;
          color: #12213f;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .two-factor-wizard-copy {
          margin: 8px 0 0;
          color: #5f7695;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 600;
        }

        .two-factor-wizard-status {
          margin-top: 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: #fff6f8;
          border: 1px solid #f2d6dd;
          color: #c15b76;
        }

        .two-factor-wizard-status::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .two-factor-wizard-status.enabled {
          background: #effcf4;
          border-color: #b8ebcc;
          color: #1f8b4e;
        }

        .two-factor-wizard-steps {
          margin: 18px 0 0;
          display: grid;
          gap: 10px;
        }

        .two-factor-wizard-step {
          border: 1px solid #e3ebf5;
          border-radius: 18px;
          background: linear-gradient(180deg, #fbfdff, #f5f9fe);
          padding: 14px 16px;
        }

        .two-factor-wizard-step strong {
          display: block;
          color: #1b2a45;
          font-size: 14px;
          font-weight: 800;
        }

        .two-factor-wizard-step span {
          display: block;
          margin-top: 5px;
          color: #68809f;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 600;
        }

        .two-factor-wizard-note {
          margin: 16px 0 0;
          border: 1px solid #dce6f2;
          border-radius: 18px;
          background: #f7fbff;
          color: #5f7898;
          font-size: 13px;
          line-height: 1.55;
          font-weight: 600;
          padding: 14px 15px;
        }

        .security-screen .sessions {
          padding: 24px 24px 18px;
          background:
            radial-gradient(circle at top right, rgba(125, 211, 252, 0.08), transparent 26%),
            linear-gradient(180deg, #ffffff, #f9fbff);
        }

        .security-screen .sessions-head {
          margin-bottom: 10px;
        }

        .security-screen .logout-link {
          border: 1px solid #d8e2f0;
          border-radius: 999px;
          background: linear-gradient(180deg, #f8fbff, #eef4fb);
          color: #516a8a;
          padding: 8px 15px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transition: all 0.2s ease;
        }

        .security-screen .logout-link:hover {
          border-color: #bdcde3;
          background: #ebf2fb;
          color: #334c6d;
        }

        .security-screen .logout-link:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .security-screen .session-item {
          margin-top: 10px;
          border: 1px solid #e4ebf4;
          border-radius: 20px;
          background: linear-gradient(180deg, #f7faff, #f2f7fd);
          padding: 15px;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .security-screen .session-item:hover {
          border-color: #d4dfed;
          background: #eef4fb;
        }

        .security-screen .device {
          width: 44px;
          height: 44px;
          background: #fff;
          box-shadow: inset 0 0 0 1px #d9e3ef, 0 4px 10px rgba(15, 23, 42, 0.08);
        }

        .security-screen .session-name {
          font-size: 18px;
          color: #10213f;
        }

        .security-screen .badge {
          background: #dcf7e7;
          color: #1f8b4e;
          border: 1px solid #b8eccd;
        }

        .security-screen .session-meta {
          font-size: 13px;
          color: #617a98;
        }

        .security-screen .open-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #fff;
          color: #5f7695;
          box-shadow: inset 0 0 0 1px #d3deeb;
        }

        .security-screen .open-btn:hover {
          background: #edf3fb;
          color: #344e71;
        }

        .security-screen .side-panel {
          padding: 24px;
          background: linear-gradient(180deg, #ffffff, #f8fbff);
        }

        .security-screen .side-panel p {
          margin-top: 8px;
          font-size: 14px;
          color: #5f7898;
          line-height: 1.55;
        }

        .security-screen .vault-scale {
          margin-top: 18px;
          border: 1px solid #dfe8f4;
          border-radius: 20px;
          background: linear-gradient(180deg, #f9fbff, #f3f8ff);
          padding: 14px 14px 12px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
        }

        .security-screen .scale-line {
          height: 8px;
          background: linear-gradient(90deg, #d8e2ef, #e7edf6);
        }

        .security-screen .scale-tabs button {
          font-size: 10px;
          color: #8093ad;
        }

        .security-screen .scale-tabs button.active {
          color: var(--accent);
        }

        .security-screen .info-box {
          border: 1px solid #d8e4f2;
          border-radius: 18px;
          background: linear-gradient(180deg, #f8fbff, #f2f7ff);
          color: #607997;
          margin-top: 14px;
          padding: 15px 15px;
          box-shadow: inset 0 0 0 1px #edf3fb;
        }

        .security-screen .data-card {
          border-color: #f1d2da;
          background:
            radial-gradient(circle at top right, rgba(240, 50, 85, 0.1), transparent 32%),
            linear-gradient(180deg, #fffafb, #fff5f8);
        }

        .security-screen .export-btn {
          height: 46px;
          border: 1px solid #efb5c2;
          color: #df2f56;
          background: linear-gradient(180deg, #ffffff, #fff8fa);
          box-shadow: 0 8px 18px rgba(223, 47, 86, 0.1);
          transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }

        .security-screen .export-btn:hover {
          transform: translateY(-1px);
          background: var(--accent);
          color: #fff;
          box-shadow: 0 12px 22px rgba(233, 63, 102, 0.24);
        }

        .security-screen .last-export {
          color: #91a1b6;
          letter-spacing: 0.09em;
        }

        .help-screen {
          padding: 14px 14px 24px;
          border-radius: 28px;
          border: 1px solid rgba(210, 223, 240, 0.75);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(248, 251, 255, 0.9)),
            radial-gradient(circle at 95% -6%, rgba(233, 63, 102, 0.2), transparent 38%),
            radial-gradient(circle at -8% 110%, rgba(59, 130, 246, 0.14), transparent 44%);
          box-shadow: 0 20px 38px rgba(20, 38, 68, 0.08);
        }

        .help-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 22px;
        }

        .help-title {
          margin: 0;
          font-size: clamp(22px, 2.3vw, 30px);
          line-height: 1.04;
          letter-spacing: -0.03em;
          color: #10213f;
          text-wrap: balance;
        }

        .help-subtitle {
          margin: 8px 0 0;
          color: #5f7390;
          font-size: 16px;
          font-weight: 600;
          max-width: 740px;
        }

        .help-save-btn {
          border: 0;
          height: 52px;
          border-radius: 999px;
          padding: 0 32px;
          background: linear-gradient(180deg, #f25a7d, #de355f);
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.01em;
          box-shadow: 0 14px 28px rgba(233, 63, 102, 0.3);
          cursor: pointer;
          line-height: 1;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }

        .help-save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 32px rgba(233, 63, 102, 0.34);
          filter: saturate(1.03);
        }

        .help-card {
          border: 1px solid #d7e3f2;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 252, 255, 0.95));
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 14px 30px rgba(24, 43, 74, 0.09);
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .help-card::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 4px;
          background: linear-gradient(90deg, rgba(233, 63, 102, 0.45), rgba(80, 124, 232, 0.25));
          pointer-events: none;
        }

        .help-card:hover {
          transform: translateY(-2px);
          border-color: #c3d3e6;
          box-shadow: 0 20px 36px rgba(24, 43, 74, 0.14);
        }

        .help-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }

        .help-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(180deg, #fff3f7, #ffe9f0);
          color: var(--accent);
          display: grid;
          place-items: center;
          font-size: 24px;
          flex: 0 0 auto;
          box-shadow: inset 0 0 0 1px #ffcfd9, 0 10px 20px rgba(233, 63, 102, 0.17);
        }

        .help-name {
          margin: 0;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #17243f;
          line-height: 1.1;
        }

        .help-copy {
          margin: 6px 0 0;
          color: #5d7697;
          font-size: 14px;
          font-weight: 600;
        }

        .help-grid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 22px;
          align-items: start;
        }

        .help-section-title {
          margin: 14px 0;
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: clamp(18px, 1.9vw, 24px);
          color: #17243f;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .help-section-title span {
          color: var(--accent);
          font-size: 18px;
        }

        .sound-list {
          display: grid;
          gap: 12px;
        }

        .sound-row {
          border: 1px solid #d8e3f1;
          background: linear-gradient(180deg, #ffffff, #f7fbff);
          border-radius: 20px;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          box-shadow: 0 12px 24px rgba(24, 43, 74, 0.08);
          transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .sound-row:hover {
          border-color: #bdcfe4;
          transform: translateY(-2px);
          box-shadow: 0 18px 30px rgba(24, 43, 74, 0.12);
        }

        .sound-row-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .sound-dot {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          background: linear-gradient(180deg, #fff2f6, #ffe9ef);
          color: var(--accent);
          display: grid;
          place-items: center;
          font-size: 17px;
          flex: 0 0 auto;
          box-shadow: inset 0 0 0 1px #ffd5de;
        }

        .sound-play-btn {
          border: 0;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .sound-play-btn:hover {
          transform: translateY(-1px);
          box-shadow: inset 0 0 0 1px #ffc8d4, 0 8px 14px rgba(233, 63, 102, 0.16);
        }

        .sound-play-btn.playing {
          box-shadow: inset 0 0 0 1px #ffbfd0, 0 0 0 3px rgba(233, 63, 102, 0.2);
        }

        .sound-title {
          margin: 0;
          font-size: 17px;
          color: #192742;
          font-weight: 800;
          line-height: 1.1;
        }

        .sound-sub {
          margin: 4px 0 0;
          color: #7388a6;
          font-size: 13px;
          font-weight: 600;
        }

        .sound-select {
          border: 1px solid #cedced;
          border-radius: 999px;
          background: #edf4fc;
          color: #243651;
          font-size: 13px;
          font-weight: 700;
          height: 40px;
          min-width: 110px;
          padding: 0 14px;
          font-family: inherit;
          cursor: pointer;
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .sound-select:hover {
          border-color: #b8cce3;
          background: #e9f1fb;
          color: #1a2d4a;
        }

        .dnd-card {
          border: 1px solid #d6e2f1;
          border-radius: 24px;
          background: linear-gradient(180deg, #ffffff, #f6fbff);
          padding: 20px;
          box-shadow: 0 18px 32px rgba(20, 38, 68, 0.12);
          position: sticky;
          top: 92px;
        }

        .dnd-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .dnd-title {
          margin: 0;
          font-size: clamp(18px, 1.9vw, 22px);
          color: #17243f;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .dnd-labels {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .dnd-label {
          font-size: 12px;
          letter-spacing: 0.1em;
          color: #6f86a4;
          font-weight: 800;
          text-transform: uppercase;
        }

        .dnd-times {
          margin-top: 6px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .dnd-time {
          height: 46px;
          border-radius: 999px;
          border: 1px solid #c7d7ea;
          background: #ebf2fb;
          color: #132542;
          font-size: 15px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dnd-time-input {
          font-family: inherit;
          text-align: center;
          padding: 0 12px;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
        }

        .dnd-time-input::-webkit-calendar-picker-indicator {
          opacity: 0.65;
          cursor: pointer;
        }

        .dnd-time-input:disabled {
          cursor: not-allowed;
          opacity: 0.58;
        }

        .dnd-time-input:disabled::-webkit-calendar-picker-indicator {
          cursor: not-allowed;
          opacity: 0.3;
        }

        .repeat-row {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #314a6b;
          font-size: 15px;
          font-weight: 700;
        }

        .repeat-mark {
          width: 23px;
          height: 23px;
          border-radius: 50%;
          border: 1px solid #c5d4e6;
          display: grid;
          place-items: center;
          color: transparent;
          background: #f7fbff;
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .repeat-mark.on {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }

        .repeat-mark:disabled {
          cursor: not-allowed;
          opacity: 0.5;
          transform: none;
        }

        .dnd-note {
          margin-top: 18px;
          border-radius: 16px;
          background: linear-gradient(180deg, #fff2f6, #ffeaf0);
          border: 1px solid #ffc5d2;
          padding: 13px 14px;
          color: #da3b5f;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 600;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .email-wrap {
          margin-top: 28px;
        }

        .email-card {
          margin-top: 10px;
          border: 1px solid #d8e3f2;
          border-radius: 24px;
          background: linear-gradient(180deg, #ffffff, #f8fcff);
          overflow: hidden;
          box-shadow: 0 16px 30px rgba(24, 43, 74, 0.1);
        }

        .email-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 18px;
          border-top: 1px solid #e3ebf6;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .email-row:hover {
          background: #f2f8ff;
          border-top-color: #d8e5f5;
        }

        .email-row:first-child {
          border-top: 0;
        }

        .email-row h4 {
          margin: 0;
          font-size: 16px;
          color: #182540;
          font-weight: 800;
        }

        .email-row p {
          margin: 5px 0 0;
          color: #6f85a4;
          font-size: 13px;
          font-weight: 600;
        }

        .email-toggle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #b8cce3;
          background: #f6faff;
          color: transparent;
          display: grid;
          place-items: center;
          font-size: 16px;
          cursor: pointer;
          flex: 0 0 auto;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }

        .email-toggle.on {
          border-color: var(--accent);
          background: var(--accent);
          color: #fff;
        }

        .email-toggle:hover {
          transform: translateY(-1px);
        }

        .help-save-btn:focus-visible,
        .sound-select:focus-visible,
        .repeat-mark:focus-visible,
        .email-toggle:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(239, 47, 90, 0.2);
        }

        .footer {
          margin-top: 20px;
          border-top: 1px solid #d6e0ec;
          padding: 20px 32px 30px;
          color: #8ea1ba;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(242, 247, 253, 0.9));
        }

        .footer-links {
          display: flex;
          gap: 22px;
        }

        .footer-links button {
          border: 0;
          background: transparent;
          color: #7f93ad;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
        }

        .footer-links button:hover {
          color: #4a627f;
        }

        button,
        input,
        select {
          transition: all 0.2s ease;
        }

        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 3px rgba(233, 63, 102, 0.24);
        }

        .settings-page.dark .sidebar,
        .settings-page.dark .menu-btn,
        .settings-page.dark .premium-card {
          background: var(--panel);
          border-color: var(--line);
        }

        .settings-page.dark .menu-btn {
          color: #d0d8e6;
        }

        .settings-page.dark .menu-btn:hover {
          background: #243244;
          border-color: #334155;
        }

        .settings-page.dark .menu-btn.active {
          border-color: transparent;
        }

        .settings-page.dark .icon-btn:hover {
          background: #243244;
        }

        .settings-page.dark .notification-btn {
          background: #253244;
          color: #d3deec;
        }

        .settings-page.dark .notification-btn:hover {
          background: #314158;
          color: #ffd0dc;
        }

        .settings-page.dark .session-confirm-dialog {
          background: #1f2b3d;
          border-color: #32465f;
          box-shadow: 0 24px 48px rgba(2, 6, 23, 0.58);
        }

        .settings-page.dark .session-confirm-title {
          color: #edf2fb;
        }

        .settings-page.dark .session-confirm-copy {
          color: #acbdd2;
        }

        .settings-page.dark .session-confirm-btn.cancel {
          border-color: #3f546f;
          background: #293950;
          color: #d6e1f1;
        }


        .settings-page.dark .main-nav button:hover {
          color: #f8b3c2;
        }

        .settings-page.dark .main-nav button.active {
          color: #ffd0dc;
        }

        .settings-page.dark .general-card:hover,
        .settings-page.dark .card:hover {
          border-color: #445269;
          box-shadow: 0 22px 44px rgba(2, 6, 23, 0.55);
        }

        .settings-page.dark .security-screen {
          background:
            radial-gradient(circle at 100% 0, rgba(59, 130, 246, 0.18), transparent 40%),
            radial-gradient(circle at 0 100%, rgba(233, 63, 102, 0.16), transparent 38%);
        }

        .settings-page.dark .security-screen .heading {
          color: #f1f5ff;
        }

        .settings-page.dark .security-screen .subheading,
        .settings-page.dark .security-screen .session-meta,
        .settings-page.dark .security-screen .side-panel p {
          color: #a9b7cb;
        }

        .settings-page.dark .security-screen .card,
        .settings-page.dark .security-screen .session-item,
        .settings-page.dark .security-screen .vault-scale,
        .settings-page.dark .security-screen .info-box {
          background: #1d293a;
          border-color: #2f4058;
        }

        .settings-page.dark .security-screen .two-factor {
          background: linear-gradient(180deg, #212f43, #1b2739);
          border-color: #32465f;
          box-shadow: 0 18px 32px rgba(2, 6, 23, 0.5);
        }

        .settings-page.dark .security-screen .shield {
          background: linear-gradient(180deg, #3b2330, #31202a);
          box-shadow: inset 0 0 0 1px #5d3243;
        }

        .settings-page.dark .security-screen .toggle {
          border-color: #445973;
          background: #2c3d54;
          box-shadow: inset 0 0 0 1px #3d516b;
        }

        .settings-page.dark .security-screen .toggle.on {
          border-color: #ef4d73;
          background: #ef4d73;
          box-shadow: 0 8px 16px rgba(239, 77, 115, 0.32);
        }

        .settings-page.dark .security-screen .wizard-btn {
          background: linear-gradient(180deg, #ef4f75, #cf2f57);
          box-shadow: 0 14px 24px rgba(207, 47, 87, 0.35);
        }

        .settings-page.dark .security-screen .two-factor h3,
        .settings-page.dark .security-screen .sessions h3,
        .settings-page.dark .security-screen .side-panel h3,
        .settings-page.dark .security-screen .session-name {
          color: #e9eef8;
        }

        .settings-page.dark .security-screen .logout-link,
        .settings-page.dark .security-screen .open-btn {
          background: #263449;
          border-color: #3a4c67;
          color: #c5d3e7;
          box-shadow: none;
        }

        .settings-page.dark .security-screen .logout-link:hover,
        .settings-page.dark .security-screen .open-btn:hover {
          background: #304058;
          color: #edf2fb;
        }

        .settings-page.dark .security-screen .device {
          background: #2a3a50;
          box-shadow: inset 0 0 0 1px #3a4e69;
          color: #dbe6f7;
        }

        .settings-page.dark .security-screen .badge {
          background: #1f4733;
          border-color: #2c6b4a;
          color: #8be2b0;
        }

        .settings-page.dark .security-screen .scale-line {
          background: linear-gradient(90deg, #33475f, #3b4f66);
        }

        .settings-page.dark .security-screen .scale-tabs button {
          color: #98a8bf;
        }

        .settings-page.dark .help-screen {
          background:
            linear-gradient(180deg, rgba(21, 33, 50, 0.92), rgba(16, 26, 40, 0.96)),
            radial-gradient(circle at 92% 0, rgba(233, 63, 102, 0.22), transparent 38%),
            radial-gradient(circle at 0 100%, rgba(59, 130, 246, 0.2), transparent 38%);
          border-color: #314258;
        }

        .settings-page.dark .help-title,
        .settings-page.dark .help-section-title,
        .settings-page.dark .help-name,
        .settings-page.dark .dnd-title,
        .settings-page.dark .sound-title,
        .settings-page.dark .email-row h4 {
          color: #e8eef9;
        }

        .settings-page.dark .help-subtitle,
        .settings-page.dark .help-copy,
        .settings-page.dark .sound-sub,
        .settings-page.dark .dnd-note,
        .settings-page.dark .email-row p,
        .settings-page.dark .footer,
        .settings-page.dark .footer-links button {
          color: #a9b9ce;
        }

        .settings-page.dark .help-card,
        .settings-page.dark .sound-row,
        .settings-page.dark .dnd-card,
        .settings-page.dark .email-card {
          border-color: #33465e;
          background: linear-gradient(180deg, #1e2b3f, #192537);
          box-shadow: 0 18px 36px rgba(2, 6, 23, 0.56);
        }

        .settings-page.dark .sound-dot,
        .settings-page.dark .help-icon {
          background: linear-gradient(180deg, #323f55, #28364a);
          box-shadow: inset 0 0 0 1px #455975;
          color: #ffb8c8;
        }

        .settings-page.dark .sound-select,
        .settings-page.dark .dnd-time {
          border-color: #405675;
          background: #26364d;
          color: #dce6f5;
        }

        .settings-page.dark .email-row {
          border-top-color: #32445c;
        }

        .settings-page.dark .email-row:hover,
        .settings-page.dark .sound-row:hover,
        .settings-page.dark .help-card:hover {
          background: #25344a;
          border-color: #45607f;
        }

        .settings-page.dark .email-toggle {
          border-color: #44607f;
          background: #25364d;
        }

        .settings-page.dark .email-toggle.on {
          border-color: var(--accent);
          background: var(--accent);
        }

        .settings-page.dark .dnd-note {
          background: linear-gradient(180deg, #402734, #33202b);
          border-color: #6d3c52;
          color: #ffc5d2;
        }

        .settings-page.dark .footer {
          border-top-color: #2f4159;
          background: linear-gradient(180deg, rgba(17, 24, 39, 0), rgba(19, 30, 48, 0.75));
        }

        .settings-page.dark .footer-links button:hover {
          color: #dce6f6;
        }

        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .general-card,
          .card,
          .save-btn,
          .wizard-btn,
          .notification-panel,
          .notification-item,
          .notification-btn {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (max-width: 1200px) {
          .topbar {
            height: auto;
            min-height: 68px;
            padding: 10px 14px;
            flex-wrap: wrap;
            gap: 10px;
          }

          .main-nav {
            order: 3;
            width: 100%;
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .main-nav button {
            padding: 4px 0 8px;
          }

          .main-nav button.active {
            padding: 4px 0 8px;
          }

          .main-nav button.active::after {
            bottom: 0;
          }

          .top-actions {
            min-width: auto;
            margin-left: auto;
          }

          .page-body {
            grid-template-columns: 1fr;
            padding: 22px 14px;
          }

          .sidebar {
            min-height: auto;
            order: 2;
            position: static;
          }

          .content {
            order: 1;
          }

          .main-grid {
            grid-template-columns: 1fr;
          }

          .security-screen .main-grid {
            grid-template-columns: 1fr;
          }

          .help-grid {
            grid-template-columns: 1fr;
          }

          .dnd-card {
            position: static;
          }

          .help-save-btn {
            height: 52px;
            font-size: 14px;
            padding: 0 30px;
          }

          .general-grid {
            grid-template-columns: 1fr;
          }

          .premium-card {
            margin-top: 16px;
          }
        }

        @media (max-width: 640px) {
          .security-screen {
            padding: 2px 0 8px;
            border-radius: 0;
            background: transparent;
          }

          .security-screen .heading {
            font-size: clamp(30px, 8vw, 36px);
          }

          .security-screen .two-factor {
            padding: 18px;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .security-screen .action-row {
            width: 100%;
            justify-content: flex-end;
          }

          .security-screen .sessions,
          .security-screen .side-panel {
            padding: 18px;
          }

          .security-screen .logout-link {
            padding: 6px 10px;
            font-size: 11px;
          }

          .help-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .help-name {
            font-size: 19px;
          }

          .help-copy {
            font-size: 13px;
          }

          .help-save-btn {
            width: 100%;
            font-size: 14px;
          }

          .help-card,
          .sound-row {
            border-radius: 18px;
          }

          .dnd-card {
            border-radius: 24px;
          }

          .sound-title {
            font-size: 16px;
          }

          .sound-sub,
          .email-row p {
            font-size: 12px;
          }

          .dnd-time {
            font-size: 15px;
            height: 50px;
          }

          .content-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .theme-switch {
            overflow-x: auto;
            padding-bottom: 8px;
          }

          .danger-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .top-actions .top-icon,
          .top-actions .divider,
          .top-actions .profile-name {
            display: none;
          }

          .notification-panel {
            right: -54px;
          }

          .footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <header className="topbar">
        <div className="brand">
          <span className="material-symbols-outlined brand-logo">diamond</span>
          <span className="brand-text">BondKeeper</span>
        </div>

        <nav className="main-nav" aria-label="Main">
          <button type="button" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button type="button" onClick={() => navigate('/shop')}>Couple Shop</button>
          <button type="button" onClick={() => navigate('/myring')}>My Ring</button>
          <button type="button" onClick={() => { onNavigateCoupleProfile(); navigate('/couple-profile'); }}>Couple Profile</button>
          <button type="button" onClick={() => { onNavigateRelationship(); navigate('/relationship'); }}>Relationship</button>
          <button type="button" className="active">Settings</button>
        </nav>

        <div className="top-actions">
          <div className="notification-wrap" ref={notificationPanelRef}>
            <button
              type="button"
              className="notification-btn"
              aria-label="Open notifications"
              aria-expanded={isNotificationOpen}
              onClick={() => setIsNotificationOpen((open) => !open)}
            >
              <span className="material-symbols-outlined">notifications_none</span>
              {unreadCount > 0 ? <span className="notification-btn-badge" /> : null}
            </button>
            {isNotificationOpen ? (
              <section className="notification-panel" role="dialog" aria-label="Notifications">
                <header className="notification-head">
                  <h2 className="notification-title">Notifications</h2>
                  <button type="button" className="notification-mark" onClick={markAllNotificationsAsRead}>
                    Mark all as read
                  </button>
                </header>
                <div className="notification-list">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`notification-item ${item.actionKey === 'pair_invitation_accept_reject' ? 'pair-invitation-item' : ''}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className={`notification-icon ${item.iconClass}`}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <h3 className="notification-item-title">{item.title}</h3>
                        <p className="notification-item-copy">{item.message}</p>
                        <div className="notification-time">{item.createdAt ? formatNotificationDate(item.createdAt) : item.time}</div>
                        {item.actionKey === 'pair_invitation_accept_reject' && (
                          <div className="pair-invitation-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                              type="button"
                              className="pair-invitation-btn pair-invitation-btn-accept"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptInvitation(item);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #ef2f5a, #ff4081)',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                            >
                              Accept Connection
                            </button>
                            <button
                              type="button"
                              className="pair-invitation-btn pair-invitation-btn-reject"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectInvitation(item);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '2px solid #ef2f5a',
                                background: 'transparent',
                                color: '#ef2f5a',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, background 0.2s'
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                      {item.unread ? <span className="notification-dot" aria-hidden="true" /> : <span />}
                    </div>
                  ))}
                </div>
                <footer className="notification-footer">View all activity</footer>
              </section>
            ) : null}
          </div>
          <button
            type="button"
            className="icon-btn top-icon"
            onClick={() => setThemeMode(isDarkTheme ? 'Light' : 'Dark')}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            <span className="material-symbols-outlined">bedtime</span>
          </button>
          <button type="button" className="icon-btn top-icon" aria-label="Shopping cart">
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>
          <span className="divider" />
          <span className="profile-name">{navDisplayName}</span>
          <img
            className="avatar"
            src={resolveApiAssetUrl(navAvatar)}
            alt={navDisplayName}
            onClick={onNavigateProfile}
          />
        </div>
      </header>

      <div className="page-body">
        <aside className="sidebar">
          <p className="sidebar-title">Settings Menu</p>
          <div className="menu-list">
            {menuItems.map((item) => (
              <button
                key={item}
                type="button"
                className={`menu-btn ${activeMenu === item ? 'active' : ''}`}
                onClick={() => setActiveMenu(item)}
              >
                <span>{item === 'General' ? '\u2699' : item === 'Security & Privacy' ? '\u26E8' : '\u2753'}</span>
                <span>{item}</span>
              </button>
            ))}
          </div>

          <section className="premium-card">
            <div className="sidebar-profile">
              <img className="sidebar-profile-avatar" src={resolveApiAssetUrl(navAvatar)} alt={navDisplayName} />
              <div className="sidebar-profile-meta">
                <h4>{navDisplayName}</h4>
                <p>{navEmail || 'Your account'}</p>
              </div>
            </div>
            <div className="sidebar-card-actions">
              <button type="button" className="sidebar-profile-btn" onClick={handleOpenProfile}>
                Profile
              </button>
              <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </section>
        </aside>

        <main className="content">
          {activeMenu === 'General' ? (
            <>
              <div className="content-head">
                <div>
                  <h1 className="general-heading">General Settings</h1>
                  <p className="general-subheading">Customize your app experience and preferences.</p>
                </div>
                <div className="head-actions">
                  <span className="save-message">{saveMessage}</span>
                  <button type="button" className="ghost-btn" onClick={handleResetSettings} disabled={isSavingSettings}>
                    Reset
                  </button>
                  <button type="button" className="save-btn" onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <section className="general-stack">
                <article className="general-card">
                  <h3><span className="general-icon">{'\u{1F3A8}'}</span>App Appearance</h3>
                  <div className="theme-switch">
                    {['Light', 'Dark', 'System'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={themeMode === mode ? 'active' : ''}
                        onClick={() => setThemeMode(mode)}
                      >
                        {mode === 'Light' ? '\u2600 ' : mode === 'Dark' ? '\u263D ' : '\u{1F5A5} '}
                        {mode}
                      </button>
                    ))}
                  </div>
                </article>

                <article className="general-card">
                  <h3><span className="general-icon">{'\u{1F514}'}</span>Notification Management</h3>
                  <div className="setting-row">
                    <div className="setting-left">
                      <div className="setting-avatar">{'\u{1F5D3}'}</div>
                      <div>
                        <h4 className="setting-title">Anniversary Reminders</h4>
                        <p className="setting-sub">Get notified 7 days and 1 day before special dates.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`toggle ${anniversaryReminders ? 'on' : ''}`}
                      onClick={() => setAnniversaryReminders((value) => !value)}
                      aria-label="Toggle anniversary reminders"
                    />
                  </div>
                  <div className="setting-row">
                    <div className="setting-left">
                      <div className="setting-avatar">{'\u21BB'}</div>
                      <div>
                        <h4 className="setting-title">System Updates</h4>
                        <p className="setting-sub">Stay informed about new features and maintenance.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`toggle ${systemUpdates ? 'on' : ''}`}
                      onClick={() => setSystemUpdates((value) => !value)}
                      aria-label="Toggle system updates"
                    />
                  </div>
                </article>

                <section className="general-grid">
                  <article className="general-card language-card">
                    <h3><span className="general-icon">{'\u{1F310}'}</span>Language</h3>
                    <input
                      className="search-input"
                      type="text"
                      value={languageSearch}
                      onChange={(event) => setLanguageSearch(event.target.value)}
                      placeholder="Search languages..."
                      aria-label="Search languages"
                    />
                    <div className="language-list">
                      {filteredLanguages.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={`language-btn ${language === item ? 'active' : ''}`}
                          onClick={() => setLanguage(item)}
                        >
                          <span>{item}</span>
                          {language === item ? <span>{'\u25CE'}</span> : null}
                        </button>
                      ))}
                      {filteredLanguages.length === 0 ? (
                        <p className="language-empty">No language found.</p>
                      ) : null}
                    </div>
                  </article>

                  <article className="general-card data-card-panel">
                    <h3><span className="general-icon">{'\u21C5'}</span>Data Management</h3>
                    <p className="data-card-intro">Keep your shared history protected and download a clean archive whenever you need it.</p>
                    <div className="data-box">
                      <div className="data-top">
                        <div className="data-copy">
                          <h4>Auto-Sync Cloud Backup</h4>
                          <p>Automatically backup your memories and ring data to the cloud. You can restore these anytime.</p>
                        </div>
                        <div className="data-toggle-shell">
                          <button
                            type="button"
                            className={`toggle ${autoSync ? 'on' : ''}`}
                            onClick={handleAutoSyncToggle}
                            aria-label="Toggle auto-sync cloud backup"
                            disabled={isSavingSettings}
                          />
                        </div>
                      </div>
                      <div className={`sync-meta ${lastSyncedAt ? 'is-synced' : 'is-pending'}`}>
                        {'\u21BB'} {formatLastSyncedLabel(lastSyncedAt, settingsLoading || isSavingSettings)}
                      </div>
                    </div>
                    <div className="data-actions">
                      <button type="button" className="download-btn" onClick={handleExportData} disabled={isExportingData}>
                        {'\u2601'} {isExportingData ? 'Preparing Download...' : 'Download All Data (.json)'}
                      </button>
                      <p className="data-note">Includes your current settings, active sessions, and recent in-app data snapshot.</p>
                    </div>
                  </article>
                </section>

              </section>
            </>
          ) : activeMenu === 'Security & Privacy' ? (
            <>
              <section className="security-screen">
                <div className="crumbs">Settings {'>'} <strong>Security & Privacy</strong></div>
                <h1 className="heading">Security & Privacy</h1>
                <p className="subheading">
                  Manage your account protection, active login sessions, and profile visibility across the Eternal Rings network.
                </p>

                <section className="main-grid">
                  <div className="left-stack">
                    <article className="card two-factor">
                      <div className="inline">
                        <div className="shield">{'\u26E8'}</div>
                        <div>
                          <h3>Two-Factor Authentication</h3>
                          <p>Protect your relationship records with an extra layer of security via SMS or Authenticator App.</p>
                          <div className={`two-factor-status ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                            {twoFactorEnabled ? 'Enabled for this account' : 'Currently turned off'}
                          </div>
                        </div>
                      </div>
                      <div className="action-row">
                        <button
                          type="button"
                          className={`toggle ${twoFactorEnabled ? 'on' : ''}`}
                          onClick={handleTwoFactorToggle}
                          aria-label="Toggle two-factor authentication"
                          disabled={isUpdatingTwoFactor}
                        />
                        <button className="wizard-btn" type="button" onClick={openTwoFactorWizard} disabled={isUpdatingTwoFactor}>
                          {isUpdatingTwoFactor ? 'Saving...' : 'Setup Wizard'}
                        </button>
                      </div>
                    </article>

                    <article className="card sessions">
                      <div className="sessions-head">
                        <h3>{'\u{1F5A5}'} Active Sessions</h3>
                        <button type="button" className="logout-link" onClick={openLogoutAllConfirm} disabled={activeSessions.length === 0}>
                          Log out all devices
                        </button>
                      </div>

                      {activeSessions.map((session) => (
                        <div className="session-item" key={session.name}>
                          <div className="session-left">
                            <div className="device">{session.icon}</div>
                            <div>
                              <h4 className="session-name">
                                {session.name}
                                {session.badge ? <span className="badge">{session.badge}</span> : null}
                              </h4>
                              <p className="session-meta">{session.location} - {session.status}</p>
                            </div>
                          </div>
                          <button
                            className="open-btn"
                            type="button"
                            aria-label={`Delete ${session.name}`}
                            title="Delete session"
                            onClick={() => openDeleteSessionConfirm(session.id)}
                          >
                            {'\u21AA'}
                          </button>
                        </div>
                      ))}
                      {activeSessions.length === 0 ? (
                        <p className="session-meta">No active sessions.</p>
                      ) : null}
                    </article>
                  </div>

                  <div className="right-stack">
                    <article className="card side-panel">
                      <h3>{'\u{1F441}'} Privacy Vault</h3>
                      <p>Control who can discover your profile and see your shared ring memories.</p>
                      <div className="vault-scale">
                        <div className="scale-line">
                          <span className="scale-dot" />
                        </div>
                        <div className="scale-tabs">
                          {['Public', 'Contacts', 'Private'].map((item) => (
                            <button
                              type="button"
                              key={item}
                              className={privacyLevel === item ? 'active' : ''}
                              onClick={() => setPrivacyLevel(item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="info-box">
                        {'\u24D8'} In Contacts mode, only people in your mutually accepted circles can view your timeline.
                      </div>
                    </article>

                    <article className="card side-panel data-card">
                      <h3>{'\u2B07'} Your Data</h3>
                      <p>
                        Download a complete archive of your relationships, gallery assets, and activity history in a secure ZIP format.
                      </p>
                      <button type="button" className="export-btn" onClick={handleExportData} disabled={isExportingData}>
                        {isExportingData ? 'Preparing Export...' : `Export Data Archive ${'\u21E9'}`}
                      </button>
                      <div className="last-export">{formatExportTime(lastExportAt)}</div>
                    </article>
                  </div>
                </section>
              </section>
            </>
          ) : activeMenu === 'Help & Support' ? (
            <>
              <section className="help-screen">
                <div className="help-head">
                  <div>
                    <h1 className="help-title">Notification & Sound</h1>
                    <p className="help-subtitle">Manage how you experience alerts and updates from your shared journey.</p>
                  </div>
                  <button type="button" className="help-save-btn" onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <article className="help-card">
                  <div className="help-left">
                    <div className="help-icon">{'\u{1F507}'}</div>
                    <div>
                      <h3 className="help-name">Global Mute</h3>
                      <p className="help-copy">Silence all app sounds and push notifications instantly for a peaceful break.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`toggle ${globalMute ? 'on' : ''}`}
                    onClick={() => setGlobalMute((value) => !value)}
                    aria-label="Toggle global mute"
                  />
                </article>

                <section className="help-grid">
                  <div>
                    <h3 className="help-section-title"><span>{'\u266B'}</span>Sound Gallery</h3>
                    <div className="sound-list">
                      <article className="sound-row">
                        <div className="sound-row-main">
                          <button
                            type="button"
                            className={`sound-dot sound-play-btn ${playingSoundId === 'anniversary' ? 'playing' : ''}`}
                            aria-label="Play anniversary sound preview"
                            onClick={() => playSoundPreview('anniversary')}
                          >
                            {'\u25B7'}
                          </button>
                          <div>
                            <h4 className="sound-title">The Ringing (Anniversary)</h4>
                            <p className="sound-sub">Elegant chime for your most important dates</p>
                          </div>
                        </div>
                        <select
                          className="sound-select"
                          value={soundPrefs.anniversary}
                          onChange={(event) =>
                            setSoundPrefs((current) => ({ ...current, anniversary: event.target.value }))
                          }
                        >
                          <option>Bell Chime</option>
                          <option>Crystal Bell</option>
                          <option>Warm Piano</option>
                        </select>
                      </article>

                      <article className="sound-row">
                        <div className="sound-row-main">
                          <button
                            type="button"
                            className={`sound-dot sound-play-btn ${playingSoundId === 'reminders' ? 'playing' : ''}`}
                            aria-label="Play reminder sound preview"
                            onClick={() => playSoundPreview('reminders')}
                          >
                            {'\u25B7'}
                          </button>
                          <div>
                            <h4 className="sound-title">The Whisper (Reminders)</h4>
                            <p className="sound-sub">A soft nudge for daily relationship goals</p>
                          </div>
                        </div>
                        <select
                          className="sound-select"
                          value={soundPrefs.reminders}
                          onChange={(event) =>
                            setSoundPrefs((current) => ({ ...current, reminders: event.target.value }))
                          }
                        >
                          <option>Soft Hum</option>
                          <option>Wind Bell</option>
                          <option>Gentle Pop</option>
                        </select>
                      </article>

                      <article className="sound-row">
                        <div className="sound-row-main">
                          <button
                            type="button"
                            className={`sound-dot sound-play-btn ${playingSoundId === 'messages' ? 'playing' : ''}`}
                            aria-label="Play message sound preview"
                            onClick={() => playSoundPreview('messages')}
                          >
                            {'\u25B7'}
                          </button>
                          <div>
                            <h4 className="sound-title">The Spark (Messages)</h4>
                            <p className="sound-sub">Instant notification for new shared messages</p>
                          </div>
                        </div>
                        <select
                          className="sound-select"
                          value={soundPrefs.messages}
                          onChange={(event) =>
                            setSoundPrefs((current) => ({ ...current, messages: event.target.value }))
                          }
                        >
                          <option>Digital Pop</option>
                          <option>Pulse Beat</option>
                          <option>Soft Tick</option>
                        </select>
                      </article>
                    </div>
                  </div>

                  <div>
                    <h3 className="help-section-title"><span>{'\u23F0'}</span>Do Not Disturb</h3>
                    <article className="dnd-card">
                      <div className="dnd-head">
                        <h4 className="dnd-title">Scheduled Silence</h4>
                        <button
                          type="button"
                          className={`toggle ${dndEnabled ? 'on' : ''}`}
                          onClick={() => setDndEnabled((value) => !value)}
                          aria-label="Toggle do not disturb"
                        />
                      </div>

                      <div className="dnd-labels">
                        <span className="dnd-label">From</span>
                        <span className="dnd-label">Until</span>
                      </div>
                      <div className="dnd-times">
                        <input
                          className="dnd-time dnd-time-input"
                          type="time"
                          value={dndFromTime}
                          onChange={(event) => setDndFromTime(event.target.value)}
                          aria-label="Do not disturb start time"
                          disabled={!dndEnabled}
                        />
                        <input
                          className="dnd-time dnd-time-input"
                          type="time"
                          value={dndUntilTime}
                          onChange={(event) => setDndUntilTime(event.target.value)}
                          aria-label="Do not disturb end time"
                          disabled={!dndEnabled}
                        />
                      </div>

                      <div className="repeat-row">
                        <button
                          type="button"
                          className={`repeat-mark ${repeatDaily ? 'on' : ''}`}
                          onClick={() => setRepeatDaily((value) => !value)}
                          aria-label="Toggle repeat every day"
                          disabled={!dndEnabled}
                        >
                          {'\u2713'}
                        </button>
                        <span>Repeat every day</span>
                      </div>

                      <div className="dnd-note">
                        <span>{'\u24D8'}</span>
                        <span>Important anniversary alerts will override DND settings to ensure you never miss a milestone.</span>
                      </div>
                    </article>
                  </div>
                </section>

                <section className="email-wrap">
                  <h3 className="help-section-title"><span>{'\u2709'}</span>Email Preferences</h3>
                  <article className="email-card">
                    <div className="email-row">
                      <div>
                        <h4>Weekly Relationship Wrap-up</h4>
                        <p>A summary of your shared moments and upcoming dates every Sunday.</p>
                      </div>
                      <button
                        type="button"
                        className={`email-toggle ${emailPrefs.weeklyWrap ? 'on' : ''}`}
                        onClick={() => setEmailPrefs((value) => ({ ...value, weeklyWrap: !value.weeklyWrap }))}
                        aria-label="Toggle weekly relationship wrap-up"
                      >
                        {'\u2713'}
                      </button>
                    </div>

                    <div className="email-row">
                      <div>
                        <h4>Product Updates & Tips</h4>
                        <p>Get the latest feature news and tips on keeping the spark alive.</p>
                      </div>
                      <button
                        type="button"
                        className={`email-toggle ${emailPrefs.productTips ? 'on' : ''}`}
                        onClick={() => setEmailPrefs((value) => ({ ...value, productTips: !value.productTips }))}
                        aria-label="Toggle product updates and tips"
                      >
                        {'\u2713'}
                      </button>
                    </div>

                    <div className="email-row">
                      <div>
                        <h4>Special Occasion Reminders</h4>
                        <p>Email alerts for birthdays, holidays, and custom anniversaries.</p>
                      </div>
                      <button
                        type="button"
                        className={`email-toggle ${emailPrefs.occasionReminders ? 'on' : ''}`}
                        onClick={() => setEmailPrefs((value) => ({ ...value, occasionReminders: !value.occasionReminders }))}
                        aria-label="Toggle special occasion reminders"
                      >
                        {'\u2713'}
                      </button>
                    </div>

                    <div className="email-row">
                      <div>
                        <h4>Partner Connection Alerts</h4>
                        <p>Notifications when your partner adds a new moment or goal.</p>
                      </div>
                      <button
                        type="button"
                        className={`email-toggle ${emailPrefs.partnerAlerts ? 'on' : ''}`}
                        onClick={() => setEmailPrefs((value) => ({ ...value, partnerAlerts: !value.partnerAlerts }))}
                        aria-label="Toggle partner connection alerts"
                      >
                        {'\u2713'}
                      </button>
                    </div>
                  </article>
                </section>
              </section>
            </>
          ) : (
            <>
              <div className="crumbs">Settings {'>'} <strong>{activeMenu}</strong></div>
              <h1 className="heading">{activeMenu}</h1>
              <p className="subheading">Click &quot;Security & Privacy&quot; in the left menu to open that feature screen.</p>
            </>
          )}
        </main>
      </div>

      {sessionToDelete ? (
        <div className="session-confirm-overlay" role="presentation" onClick={closeDeleteSessionConfirm}>
          <section
            className="session-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm delete session"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="session-confirm-title">Are you sure delete?</h2>
            <p className="session-confirm-copy">This will remove this active device session.</p>
            <div className="session-confirm-actions">
              <button type="button" className="session-confirm-btn cancel" onClick={closeDeleteSessionConfirm}>Cancel</button>
              <button type="button" className="session-confirm-btn ok" onClick={confirmDeleteSession}>OK</button>
            </div>
          </section>
        </div>
      ) : null}

      {isTwoFactorWizardOpen ? (
        <div className="session-confirm-overlay" role="presentation" onClick={closeTwoFactorWizard}>
          <section
            className="two-factor-wizard"
            role="dialog"
            aria-modal="true"
            aria-label="Two-factor setup wizard"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="two-factor-wizard-head">
              <div className="two-factor-wizard-icon">{'\u26E8'}</div>
              <div>
                <h2 className="two-factor-wizard-title">Two-Factor Setup Wizard</h2>
                <p className="two-factor-wizard-copy">
                  Turn this protection on or off and keep the setting synced to your account.
                </p>
              </div>
            </div>

            <div className={`two-factor-wizard-status ${twoFactorEnabled ? 'enabled' : ''}`}>
              {twoFactorEnabled ? 'Two-factor is enabled' : 'Two-factor is disabled'}
            </div>

            <div className="two-factor-wizard-steps">
              <div className="two-factor-wizard-step">
                <strong>Step 1</strong>
                <span>Choose whether you want extra account protection enabled for this profile.</span>
              </div>
              <div className="two-factor-wizard-step">
                <strong>Step 2</strong>
                <span>Save the change instantly from this wizard without leaving the Security screen.</span>
              </div>
              <div className="two-factor-wizard-step">
                <strong>Step 3</strong>
                <span>Come back here anytime to update the setting again.</span>
              </div>
            </div>

            <p className="two-factor-wizard-note">
              This screen now saves your two-factor preference to the backend. Full SMS or authenticator code verification
              during sign-in would need a dedicated authentication flow.
            </p>

            <div className="session-confirm-actions">
              <button type="button" className="session-confirm-btn cancel" onClick={closeTwoFactorWizard} disabled={isUpdatingTwoFactor}>
                Cancel
              </button>
              <button type="button" className="session-confirm-btn ok" onClick={handleTwoFactorWizardSubmit} disabled={isUpdatingTwoFactor}>
                {isUpdatingTwoFactor ? 'Saving...' : twoFactorEnabled ? 'Disable Two-Factor' : 'Enable Two-Factor'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isDeleteAccountConfirmOpen ? (
        <div className="session-confirm-overlay" role="presentation" onClick={closeDeleteAccountConfirm}>
          <section
            className="session-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm delete account"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="session-confirm-title">Delete your account?</h2>
            <p className="session-confirm-copy">
              This will remove local account settings and cannot be undone.
            </p>
            <div className="session-confirm-actions">
              <button type="button" className="session-confirm-btn cancel" onClick={closeDeleteAccountConfirm}>Cancel</button>
              <button type="button" className="session-confirm-btn ok" onClick={confirmDeleteAccount}>Delete</button>
            </div>
          </section>
        </div>
      ) : null}

      {isLogoutAllConfirmOpen ? (
        <div className="session-confirm-overlay" role="presentation" onClick={closeLogoutAllConfirm}>
          <section
            className="session-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm logout all devices"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="session-confirm-title">Log out all devices?</h2>
            <p className="session-confirm-copy">
              This will clear your active sessions on this Settings screen and remove local login state.
            </p>
            <div className="session-confirm-actions">
              <button type="button" className="session-confirm-btn cancel" onClick={closeLogoutAllConfirm}>Cancel</button>
              <button type="button" className="session-confirm-btn ok" onClick={confirmLogoutAllDevices}>Log out</button>
            </div>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        title="Log Out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        cancelLabel="Stay Here"
        onConfirm={() => {
          void confirmLogout();
        }}
        onClose={() => setIsLogoutConfirmOpen(false)}
      />

      <footer className="footer">
        <span>{'\u00A9'} 2024 Eternal Rings App. Designed for forever.</span>
        <div className="footer-links">
          <button type="button">Privacy Policy</button>
          <button type="button">Terms of Service</button>
          <button type="button">Contact Us</button>
        </div>
      </footer>
    </div>
  );
};

export default SettingsView;
