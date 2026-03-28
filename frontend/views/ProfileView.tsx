import React from 'react';
import { api, resolveApiAssetUrl } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getStoredAuthValue,
  getUserScopedLocalStorageItem,
  removeUserScopedLocalStorageItem,
  setUserScopedLocalStorageItem,
} from '../lib/userStorage';

const PROFILE_STORAGE_KEY = 'bondkeeper_profile_persist_v1';
const USER_AVATAR_STORAGE_KEY = 'bondkeeper_user_avatar_url';
const RELATIONSHIP_DAYS_STORAGE_KEY = 'relationship_days_together';
const USER_AVATAR_UPDATED_EVENT = 'bondkeeper:user-avatar-updated';
const USER_PROFILE_UPDATED_EVENT = 'bondkeeper:user-profile-updated';
const RELATIONSHIP_DAYS_UPDATED_EVENT = 'bondkeeper:relationship-days-updated';
const DEFAULT_PROFILE_NAME = 'Member';
const PROFILE_HANDLE_MIN_LENGTH = 3;
const PROFILE_HANDLE_MAX_LENGTH = 30;
const RESERVED_PROFILE_HANDLES = new Set([
  'admin',
  'api',
  'auth',
  'cart',
  'dashboard',
  'login',
  'logout',
  'memories',
  'profile',
  'register',
  'relationship',
  'reset-password',
  'settings',
  'shop',
  'u',
]);

type ProfileData = {
  title: string;
  togetherSince: string;
  handle: string;
  phone: string;
  avatarUrl: string;
  linkedPartnerLabel: string;
  daysTogether: number;
};

type ProfileViewProps = {
  onNavigateDashboard?: () => void;
  onNavigateCoupleShop?: () => void;
  onNavigateMyRing?: () => void;
  onNavigateRelationship?: () => void;
  onNavigateSettings?: () => void;
  onNavigateCoupleProfile?: () => void;
  onNavigateProfile?: () => void;
};

function normalizeProfileData(data: unknown, fallback: ProfileData): ProfileData {
  const source = data && typeof data === 'object' ? (data as Partial<ProfileData>) : {};
  const daysTogether = Number(source.daysTogether);

  return {
    title: String(source.title || fallback.title).trim() || fallback.title,
    togetherSince: String(source.togetherSince || fallback.togetherSince).trim() || fallback.togetherSince,
    handle: sanitizeProfileHandle(String(source.handle || fallback.handle).trim() || fallback.handle),
    phone: String(source.phone || fallback.phone).trim() || fallback.phone,
    avatarUrl: String(source.avatarUrl || '').trim(),
    linkedPartnerLabel:
      String(source.linkedPartnerLabel || fallback.linkedPartnerLabel).trim() || fallback.linkedPartnerLabel,
    daysTogether: Number.isFinite(daysTogether) && daysTogether >= 0 ? daysTogether : fallback.daysTogether,
  };
}

function sanitizeProfileHandle(value: string, fallback = '') {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/[_-]{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');

  return normalized || String(fallback || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/[_-]{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');
}

function getHandleValidationMessage(handle: string) {
  if (!handle) {
    return 'Choose a profile handle before saving.';
  }

  if (handle.length < PROFILE_HANDLE_MIN_LENGTH || handle.length > PROFILE_HANDLE_MAX_LENGTH) {
    return `Use ${PROFILE_HANDLE_MIN_LENGTH}-${PROFILE_HANDLE_MAX_LENGTH} characters.`;
  }

  if (!/^[a-z0-9_-]+$/.test(handle)) {
    return 'Only letters, numbers, hyphens, and underscores are allowed.';
  }

  if (RESERVED_PROFILE_HANDLES.has(handle)) {
    return 'That handle is reserved. Please choose another one.';
  }

  return '';
}

function getShareLinkUrl(handle: string) {
  if (typeof window === 'undefined') {
    return `/u/${handle}`;
  }

  return new URL(`/u/${handle}`, window.location.origin).toString();
}

function getShareLinkBaseLabel() {
  if (typeof window === 'undefined') {
    return 'eternalrings.app/u/';
  }

  return `${window.location.host}/u/`;
}

const ProfileView = ({
  onNavigateDashboard = () => {},
  onNavigateCoupleShop = () => {},
  onNavigateMyRing = () => {},
  onNavigateRelationship = () => {},
  onNavigateSettings = () => {},
  onNavigateCoupleProfile = () => {},
  onNavigateProfile = () => {}
}: ProfileViewProps) => {
  const initialProfile = React.useMemo<ProfileData>(() => ({
    title: 'Alex & Sam',
    togetherSince: 'Celebrating love since October 12, 2021',
    handle: 'alex_and_sam',
    phone: '+1 555-0123',
    avatarUrl: '',
    linkedPartnerLabel: 'Connected with your partner',
    daysTogether: 0
  }), []);

  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [profile, setProfile] = React.useState<ProfileData>(initialProfile);
  const [draftProfile, setDraftProfile] = React.useState<ProfileData>(initialProfile);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = React.useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [shareMessage, setShareMessage] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const shareMessageTimerRef = React.useRef<number | null>(null);

  const shareLinkBaseLabel = React.useMemo(() => getShareLinkBaseLabel(), []);
  const normalizedDraftHandle = React.useMemo(() => sanitizeProfileHandle(draftProfile.handle), [draftProfile.handle]);
  const activeHandle = isEditing ? normalizedDraftHandle : profile.handle;
  const shareLinkUrl = React.useMemo(() => getShareLinkUrl(activeHandle), [activeHandle]);
  const handleValidationMessage = React.useMemo(
    () => getHandleValidationMessage(normalizedDraftHandle),
    [normalizedDraftHandle]
  );

  const readPersistedProfile = React.useCallback(() => {
    try {
      const raw = getUserScopedLocalStorageItem(PROFILE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return normalizeProfileData(parsed, initialProfile);
    } catch {
      return null;
    }
  }, [initialProfile]);

  const persistProfile = React.useCallback((data: ProfileData) => {
    try {
      setUserScopedLocalStorageItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore local storage write errors (private mode or quota limits).
    }
  }, []);

  const readPersistedRelationshipDays = React.useCallback(() => {
    try {
      const rawValue = getUserScopedLocalStorageItem(RELATIONSHIP_DAYS_STORAGE_KEY);
      const parsedValue = Number(rawValue);
      return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
    } catch {
      return 0;
    }
  }, []);

  const persistRelationshipDays = React.useCallback((days: number) => {
    const normalizedDays = Number.isFinite(days) && days >= 0 ? Math.floor(days) : 0;
    try {
      setUserScopedLocalStorageItem(RELATIONSHIP_DAYS_STORAGE_KEY, String(normalizedDays));
      window.dispatchEvent(new Event(RELATIONSHIP_DAYS_UPDATED_EVENT));
    } catch {
      // Ignore local storage write errors (private mode or quota limits).
    }
  }, []);

  const persistUserAvatar = React.useCallback((nextAvatarUrl: string) => {
    try {
      if (nextAvatarUrl) {
        setUserScopedLocalStorageItem(USER_AVATAR_STORAGE_KEY, nextAvatarUrl);
      } else {
        removeUserScopedLocalStorageItem(USER_AVATAR_STORAGE_KEY);
      }
      window.dispatchEvent(new Event(USER_AVATAR_UPDATED_EVENT));
    } catch {
      // Ignore local storage write errors (private mode or quota limits).
    }
  }, []);

  const syncProfileIdentity = React.useCallback((nextTitle: string) => {
    const normalizedTitle = String(nextTitle || '').trim() || DEFAULT_PROFILE_NAME;
    sessionStorage.setItem('auth_name', normalizedTitle);
    window.dispatchEvent(new Event(USER_PROFILE_UPDATED_EVENT));
  }, []);

  const applyProfile = React.useCallback((data: unknown) => {
    const next = normalizeProfileData(data, initialProfile);
    const persistedRelationshipDays = readPersistedRelationshipDays();
    if (next.daysTogether <= 0 && persistedRelationshipDays > 0) {
      next.daysTogether = persistedRelationshipDays;
    } else if (next.daysTogether > 0) {
      persistRelationshipDays(next.daysTogether);
    }
    setProfile(next);
    setDraftProfile(next);
    setAvatarUrl(next.avatarUrl || '');
    persistProfile(next);
    syncProfileIdentity(next.title);
  }, [initialProfile, persistProfile, persistRelationshipDays, readPersistedRelationshipDays, syncProfileIdentity]);

  const showShareMessage = React.useCallback((message: string) => {
    setShareMessage(message);
    if (shareMessageTimerRef.current) {
      window.clearTimeout(shareMessageTimerRef.current);
    }
    shareMessageTimerRef.current = window.setTimeout(() => {
      setShareMessage('');
      shareMessageTimerRef.current = null;
    }, 2200);
  }, []);

  React.useEffect(() => () => {
    if (shareMessageTimerRef.current) {
      window.clearTimeout(shareMessageTimerRef.current);
    }
  }, []);

  React.useEffect(() => {
    const syncRelationshipDays = () => {
      const nextDaysTogether = readPersistedRelationshipDays();
      setProfile((current) => {
        if (current.daysTogether === nextDaysTogether) {
          return current;
        }

        const nextProfile = { ...current, daysTogether: nextDaysTogether };
        persistProfile(nextProfile);
        return nextProfile;
      });
      setDraftProfile((current) => ({ ...current, daysTogether: nextDaysTogether }));
    };

    window.addEventListener('focus', syncRelationshipDays);
    window.addEventListener('storage', syncRelationshipDays);
    window.addEventListener(RELATIONSHIP_DAYS_UPDATED_EVENT, syncRelationshipDays);

    return () => {
      window.removeEventListener('focus', syncRelationshipDays);
      window.removeEventListener('storage', syncRelationshipDays);
      window.removeEventListener(RELATIONSHIP_DAYS_UPDATED_EVENT, syncRelationshipDays);
    };
  }, [persistProfile, readPersistedRelationshipDays]);

  React.useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const persisted = readPersistedProfile();
        if (persisted && active) {
          applyProfile(persisted);
        }

        const rawUserId = getStoredAuthValue('auth_user_id');
        const profileData = await api.get<Partial<ProfileData>>('/profile/me/current');
        const userData = rawUserId
          ? await api.get<{ avatarUrl?: string | null }>(`/users/${rawUserId}`).catch(() => null)
          : null;
        if (!active) return;
        const nextAvatarUrl =
          userData && typeof userData === 'object' && 'avatarUrl' in userData
            ? userData.avatarUrl || profileData.avatarUrl || ''
            : profileData.avatarUrl || '';
        applyProfile({
          ...profileData,
          avatarUrl: nextAvatarUrl,
        });
        persistUserAvatar(nextAvatarUrl);
      } catch (err) {
        if (!active) return;
        const persisted = readPersistedProfile();
        if (persisted) {
          applyProfile(persisted);
          setError('Live profile data could not be loaded, so saved local details are being shown.');
        } else {
          setError('Profile data could not be loaded. Default details are shown until the server is available.');
          applyProfile(initialProfile);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [applyProfile, persistUserAvatar, readPersistedProfile]);

  const handleOpenPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setIsEditing(true);
        setAvatarUrl(reader.result);
        setDraftProfile((prev) => ({ ...prev, avatarUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopySharedLink = async () => {
    if (!activeHandle || handleValidationMessage) {
      showShareMessage(handleValidationMessage || 'Enter a valid handle first.');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLinkUrl);
      showShareMessage('Shared link copied.');
    } catch {
      showShareMessage('Could not copy the link automatically.');
    }
  };

  const handleOpenSharedLink = () => {
    if (!activeHandle || handleValidationMessage) {
      showShareMessage(handleValidationMessage || 'Enter a valid handle first.');
      return;
    }

    window.open(shareLinkUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStartEdit = () => {
    setDraftProfile(profile);
    setAvatarUrl(profile.avatarUrl || '');
    setIsEditing(true);
    setShareMessage('');
  };

  const handleSaveProfile = async () => {
    if (handleValidationMessage) {
      setError(handleValidationMessage);
      return;
    }

    const payload = {
      ...draftProfile,
      handle: normalizedDraftHandle,
      avatarUrl,
    };

    try {
      setSaving(true);
      setError('');

      let persistedAvatarUrl = avatarUrl;
      const rawUserId = getStoredAuthValue('auth_user_id');
      if (rawUserId && avatarUrl && avatarUrl !== profile.avatarUrl) {
        const avatarResponse = await api.patch<{ avatarUrl?: string }>(`/users/${rawUserId}/avatar`, { avatarUrl });
        persistedAvatarUrl = avatarResponse?.avatarUrl || avatarUrl;
        persistUserAvatar(persistedAvatarUrl);
      }

      const savedProfile = await api.patch<Partial<ProfileData>>('/profile/me/current', {
        ...payload,
        avatarUrl: persistedAvatarUrl,
      });

      applyProfile({
        ...savedProfile,
        avatarUrl: persistedAvatarUrl || savedProfile.avatarUrl || '',
      });
      setIsEditing(false);
      setShareMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile changes could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftProfile(profile);
    setAvatarUrl(profile.avatarUrl || '');
    setIsEditing(false);
    setShareMessage('');
    setError('');
  };

  const handleQuickPhoneChange = async () => {
    const next = window.prompt('Update your phone number', profile.phone);
    if (next === null) return;
    const value = next.trim();
    if (!value) {
      setError('Phone number cannot be empty.');
      return;
    }

    try {
      setIsUpdatingPhone(true);
      setError('');

      const savedProfile = await api.patch<Partial<ProfileData>>('/profile/me/current', {
        ...profile,
        phone: value,
        avatarUrl: profile.avatarUrl || avatarUrl,
      });

      applyProfile({
        ...profile,
        ...savedProfile,
        phone: value,
        avatarUrl: savedProfile.avatarUrl || profile.avatarUrl || avatarUrl || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phone number could not be updated.');
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleSignOut = () => {
    setIsSignOutConfirmOpen(true);
  };

  const confirmSignOut = async () => {
    setIsSignOutConfirmOpen(false);
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Clear client auth state even if the server-side session record is unavailable.
    } finally {
      ['auth_user_id', 'auth_roles', 'auth_session_token'].forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });
      window.location.reload();
    }
  };

  return (
    <div className="profile-page">
      <style>{`
        .profile-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(239, 47, 90, 0.12), transparent 24%),
            radial-gradient(circle at bottom left, rgba(61, 119, 228, 0.12), transparent 26%),
            linear-gradient(180deg, #f8fbff 0%, #eef3fa 100%);
          color: #13213c;
          font-family: Manrope, 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
          font-size: 0.82rem;
          line-height: 1.45;
        }

        .dark .profile-page {
          background:
            radial-gradient(circle at top right, rgba(239, 47, 90, 0.12), transparent 24%),
            radial-gradient(circle at bottom left, rgba(61, 119, 228, 0.12), transparent 26%),
            linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #e5e7eb;
        }

        * {
          box-sizing: border-box;
        }

        .profile-page::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.26) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.18) 1px, transparent 1px);
          background-size: 120px 120px;
          mask-image: radial-gradient(circle at center, black, transparent 80%);
          opacity: 0.45;
        }

        .dark .profile-page::before {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          opacity: 0.3;
        }

        .topbar {
          height: 68px;
          border-bottom: 1px solid #e8e2ea;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 56px;
          gap: 24px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .brand-logo {
          color: #f542a7;
          font-size: 1rem;
        }

        .brand-text {
          color: #f542a7;
          font-size: 1.32rem;
          font-weight: 600;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .main-nav {
          flex: 1;
          display: flex;
          justify-content: flex-start;
          gap: 34px;
          margin-left: 28px;
        }

        .main-nav button {
          border: 0;
          background: transparent;
          font-size: 0.92rem;
          cursor: pointer;
          padding: 4px 0;
          color: #27272a;
          font-weight: 500;
        }

        .main-nav button:hover {
          color: #f542a7;
        }

        .main-nav button.active {
          color: #f542a7;
          font-weight: 700;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .top-icon-btn {
          border: 0;
          background: transparent;
          cursor: pointer;
          color: #27272a;
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .top-icon-btn .material-symbols-outlined {
          font-size: 0.92rem;
          font-variation-settings: 'wght' 250;
        }

        .divider {
          width: 1px;
          height: 24px;
          background: #e6e2e8;
        }

        .profile-name {
          font-size: 1rem;
          font-weight: 500;
          color: #1f1f23;
        }

        .mini-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #f0edf2;
          object-fit: cover;
        }

        .profile-chevron {
          color: #9b96a2;
          font-size: 0.875rem;
          line-height: 1;
          margin-left: -6px;
          margin-right: 2px;
        }

        .wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 72px 20px 64px;
        }

        .hero {
          text-align: center;
          margin-bottom: 56px;
          padding: 30px 28px 24px;
          border-radius: 34px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 246, 251, 0.8));
          border: 1px solid rgba(255, 255, 255, 0.92);
          box-shadow:
            0 30px 60px rgba(20, 36, 64, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(4px);
        }

        .hero-avatar-wrap {
          position: relative;
          width: 196px;
          height: 196px;
          margin: 0 auto;
        }

        .hero-avatar {
          width: 196px;
          height: 196px;
          border-radius: 50%;
          background: linear-gradient(180deg, #c7d0db, #aeb8c7);
          border: 7px solid rgba(255, 255, 255, 0.96);
          box-shadow:
            0 24px 44px rgba(18, 33, 59, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.6);
          object-fit: cover;
          display: block;
        }

        .avatar-camera {
          position: absolute;
          right: -6px;
          bottom: 10px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 3px solid #fff;
          background: linear-gradient(160deg, #ff4f87, #ef2f5a);
          color: #fff;
          font-size: 1.25rem;
          display: grid;
          place-items: center;
          box-shadow: 0 16px 30px rgba(239, 47, 90, 0.35);
          cursor: pointer;
        }

        .hero h1 {
          margin: 24px 0 8px;
          font-size: clamp(16px, 2.6vw, 20px);
          letter-spacing: -0.04em;
          line-height: 1.08;
          color: #15233e;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          font-weight: 700;
          text-wrap: balance;
        }

        .hero p {
          margin: 0;
          color: #ef2f5a;
          font-size: clamp(15px, 1.8vw, 24px);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .status-note {
          margin: 14px 0 0;
          color: #70829d;
          font-size: 12px;
          font-weight: 700;
        }

        .status-note.error {
          color: #b43a58;
        }

        .edit-actions {
          margin-top: 28px;
          display: inline-flex;
          gap: 12px;
        }

        .edit-btn,
        .save-btn,
        .cancel-btn {
          border: 0;
          border-radius: 999px;
          height: 56px;
          padding: 0 34px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .edit-btn,
        .save-btn {
          background: linear-gradient(180deg, #ff4f87, #ef2f5a);
          color: #fff;
          box-shadow: 0 16px 30px rgba(239, 47, 90, 0.28);
        }

        .cancel-btn {
          border: 1px solid #d4ddec;
          background: #fff;
          color: #627896;
        }

        .profile-input {
          width: min(100%, 460px);
          height: 48px;
          border-radius: 12px;
          border: 1px solid #d8e0ec;
          background: #fff;
          color: #15233e;
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          padding: 0 12px;
          margin: 6px auto;
          display: block;
          font-family: inherit;
        }

        .profile-input.sub {
          color: #ef2f5a;
          font-size: 15px;
          height: 44px;
        }

        .days-card {
          border: 1px solid rgba(242, 214, 220, 0.95);
          border-radius: 34px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 244, 247, 0.96));
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 18px 34px rgba(32, 54, 91, 0.08);
        }

        .days-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .days-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(180deg, #fff1f4, #ffe7ed);
          color: #ef2f5a;
          display: grid;
          place-items: center;
          font-size: 26px;
          flex: 0 0 auto;
        }

        .days-label {
          margin: 0;
          color: #627896;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .days-value {
          margin: 3px 0 0;
          color: #ef2f5a;
          font-size: clamp(22px, 3.2vw, 32px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .days-right {
          text-align: right;
        }

        .days-avatars {
          font-size: 28px;
          line-height: 1;
        }

        .days-link {
          margin-top: 10px;
          color: #4c6280;
          font-size: 13px;
          font-weight: 700;
        }

        .days-dot {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #27b95d;
          margin-right: 8px;
        }

        .grid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 18px;
        }

        .card {
          border: 1px solid rgba(223, 232, 243, 0.95);
          border-radius: 30px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 255, 0.96));
          padding: 24px;
          box-shadow: 0 16px 32px rgba(28, 50, 87, 0.07);
        }

        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .feature-card {
          position: relative;
          overflow: hidden;
          padding: 28px;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.95;
        }

        .link-card::before {
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 42%),
            radial-gradient(circle at bottom left, rgba(239, 47, 90, 0.1), transparent 34%);
        }

        .phone-card::before {
          background:
            radial-gradient(circle at top right, rgba(34, 197, 94, 0.14), transparent 42%),
            radial-gradient(circle at bottom left, rgba(37, 99, 235, 0.08), transparent 34%);
        }

        .feature-card > * {
          position: relative;
          z-index: 1;
        }

        .feature-kicker {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .feature-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .feature-tag {
          color: #6c8199;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-size: 20px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .card-icon.link {
          background: linear-gradient(135deg, #eff5ff, #dde9ff);
          color: #2b67ef;
        }

        .card-icon.phone {
          background: linear-gradient(135deg, #effcf5, #daf6e4);
          color: #1caa66;
        }

        .verified {
          border-radius: 999px;
          background: linear-gradient(135deg, #ebfbf1, #d8f5e4);
          color: #1f9b5d;
          font-size: 10px;
          font-weight: 900;
          padding: 8px 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid rgba(35, 164, 100, 0.12);
        }

        .card h3 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -0.03em;
          color: #16243e;
        }

        .card p {
          margin: 12px 0 20px;
          color: #6e819c;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 600;
          max-width: 480px;
        }

        .feature-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .feature-badge.live {
          background: linear-gradient(135deg, #eef5ff, #d9e9ff);
          color: #2153c4;
          border: 1px solid rgba(33, 83, 196, 0.12);
        }

        .handle-box {
          min-height: 94px;
          border: 1px solid #d9e4f1;
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(240, 246, 255, 0.96));
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 8px;
          padding: 18px 20px;
          color: #8093a9;
          font-size: 12px;
          font-weight: 700;
          overflow: hidden;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.88),
            0 16px 26px rgba(24, 42, 73, 0.07);
        }

        .handle-prefix {
          color: #6b81a0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .handle-box strong {
          color: #15233e;
          font-size: clamp(24px, 3vw, 32px);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .handle-input {
          border: 0;
          background: transparent;
          color: #15233e;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          width: 100%;
          min-width: 0;
          outline: none;
          font-family: inherit;
          padding: 0;
        }

        .link-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 14px;
        }

        .handle-helper {
          color: #6b7d94;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.45;
          margin: 0;
          flex: 1;
        }

        .handle-helper.error {
          color: #b42318;
        }

        .feature-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(24, 42, 73, 0.06);
          color: #45617f;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .handle-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }

        .handle-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          border-radius: 999px;
          border: 1px solid #d4ddec;
          background: #fff;
          color: #15233e;
          padding: 0 20px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
          box-shadow: 0 10px 18px rgba(18, 31, 57, 0.06);
        }

        .handle-action-btn.primary {
          background: linear-gradient(135deg, #15325f, #254b88);
          border-color: #15325f;
          color: #fff;
          box-shadow: 0 18px 30px rgba(25, 54, 103, 0.26);
        }

        .handle-action-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #a8b8ce;
        }

        .handle-action-btn:disabled {
          opacity: 0.56;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .phone-shell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px;
          border-radius: 24px;
          border: 1px solid #d9e5f1;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(243, 248, 255, 0.96));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.88),
            0 16px 26px rgba(24, 42, 73, 0.07);
        }

        .phone-main {
          min-width: 0;
          flex: 1;
        }

        .phone-label {
          display: inline-block;
          margin-bottom: 8px;
          color: #6b8199;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .phone-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .phone-value {
          color: #16243e;
          font-size: clamp(28px, 3vw, 36px);
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 1;
        }

        .phone-input {
          border: 1px solid #d8e0ec;
          border-radius: 18px;
          background: #fff;
          color: #16243e;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.04em;
          height: 58px;
          padding: 0 16px;
          width: min(100%, 360px);
          font-family: inherit;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
        }

        .phone-caption {
          display: inline-block;
          margin-top: 12px;
          color: #70829a;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.45;
        }

        .change-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 999px;
          min-height: 46px;
          padding: 0 20px;
          background: linear-gradient(135deg, #ff5d8e, #ef2f5a);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 18px 30px rgba(239, 47, 90, 0.22);
        }

        .change-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signout {
          margin-top: 20px;
          border: 1px solid rgba(243, 211, 217, 0.95);
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 246, 248, 0.96));
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 14px 28px rgba(29, 49, 86, 0.06);
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .signout:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 30px rgba(29, 49, 86, 0.09);
          border-color: rgba(239, 47, 90, 0.28);
        }

        .signout-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .signout-icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1px solid #f1ccd4;
          color: #ef2f5a;
          display: grid;
          place-items: center;
          font-size: 16px;
        }

        .signout h4 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.02em;
          color: #111f39;
        }

        .signout p {
          margin: 3px 0 0;
          color: #6e819d;
          font-size: 13px;
          font-weight: 600;
        }

        .signout-arrow {
          color: #c8d2de;
          font-size: 22px;
          line-height: 1;
        }

        .footer {
          margin-top: 120px;
          text-align: center;
          color: #9aaac0;
          font-size: 12px;
          font-weight: 600;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 10px;
        }

        .footer-links button {
          border: 0;
          background: transparent;
          color: #9aaac0;
          font-size: 12px;
          cursor: pointer;
        }

        .hidden-input {
          display: none;
        }

        .dark .hero,
        .dark .days-card,
        .dark .card,
        .dark .signout {
          background: linear-gradient(180deg, rgba(17, 24, 39, 0.94), rgba(30, 41, 59, 0.94));
          border-color: rgba(148, 163, 184, 0.22);
          box-shadow: 0 18px 40px rgba(2, 6, 23, 0.35);
        }

        .dark .hero h1,
        .dark .card h3,
        .dark .phone-value,
        .dark .signout h4,
        .dark .handle-box strong,
        .dark .handle-input,
        .dark .profile-input,
        .dark .phone-input {
          color: #f8fafc;
        }

        .dark .hero p,
        .dark .status-note,
        .dark .days-label,
        .dark .days-link,
        .dark .card p,
        .dark .handle-box,
        .dark .footer,
        .dark .footer-links button,
        .dark .signout p {
          color: #94a3b8;
        }

        .dark .feature-tag,
        .dark .phone-label,
        .dark .handle-prefix {
          color: #94a3b8;
        }

        .dark .handle-helper {
          color: #94a3b8;
        }

        .dark .handle-helper.error {
          color: #fda4af;
        }

        .dark .feature-badge.live {
          background: rgba(37, 99, 235, 0.18);
          color: #bfdbfe;
          border-color: rgba(96, 165, 250, 0.2);
        }

        .dark .feature-pill {
          background: rgba(148, 163, 184, 0.12);
          color: #cbd5e1;
        }

        .dark .profile-input,
        .dark .phone-input,
        .dark .handle-box,
        .dark .cancel-btn {
          background: #111827;
          border-color: #374151;
        }

        .dark .phone-shell {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.96));
          border-color: rgba(71, 85, 105, 0.8);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 16px 26px rgba(2, 6, 23, 0.3);
        }

        .dark .handle-action-btn {
          background: #0f172a;
          border-color: #334155;
          color: #e5e7eb;
        }

        .dark .handle-action-btn.primary {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-color: #2563eb;
          color: #eff6ff;
          box-shadow: 0 14px 32px rgba(37, 99, 235, 0.2);
        }

        .dark .cancel-btn {
          color: #e5e7eb;
        }

        .dark .verified {
          background: rgba(34, 197, 94, 0.12);
          color: #86efac;
          border-color: rgba(52, 211, 153, 0.16);
        }

        .dark .card-icon.link {
          background: rgba(59, 130, 246, 0.16);
          color: #93c5fd;
        }

        .dark .card-icon.phone {
          background: rgba(34, 197, 94, 0.16);
          color: #86efac;
        }

        .dark .days-icon {
          background: rgba(236, 19, 128, 0.12);
          color: #f472b6;
        }

        .dark .change-btn {
          background: linear-gradient(135deg, #ef476f, #db2777);
          color: #fff1f2;
          box-shadow: 0 18px 30px rgba(244, 63, 94, 0.2);
        }

        .dark .phone-caption {
          color: #94a3b8;
        }

        .dark .signout-icon {
          border-color: rgba(236, 19, 128, 0.28);
          color: #f472b6;
        }

        .dark .signout-arrow {
          color: #64748b;
        }

        @media (max-width: 1100px) {
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
            margin-left: 0;
          }

          .main-nav button {
            padding: 4px 0 8px;
          }

          .top-actions {
            min-width: auto;
            margin-left: auto;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .top-actions .top-icon-btn,
          .top-actions .divider,
          .top-actions .profile-name {
            display: none;
          }

          .wrap {
            padding-top: 36px;
          }

          .hero {
            margin-bottom: 34px;
          }

          .hero-avatar-wrap {
            width: 156px;
            height: 156px;
          }

          .hero-avatar {
            width: 156px;
            height: 156px;
          }

          .avatar-camera {
            width: 52px;
            height: 52px;
            font-size: 18px;
          }

          .days-card {
            border-radius: 24px;
            flex-direction: column;
            align-items: flex-start;
          }

          .days-right {
            text-align: left;
          }

          .card h3,
          .signout h4 {
            font-size: 20px;
          }

          .phone-value {
            font-size: 20px;
          }

          .card-head,
          .link-meta,
          .phone-shell {
            align-items: flex-start;
          }

          .card-head,
          .link-meta,
          .phone-row {
            flex-direction: column;
          }

          .phone-shell {
            flex-direction: column;
          }

          .handle-actions,
          .phone-shell .change-btn {
            width: 100%;
          }

          .handle-action-btn,
          .change-btn {
            width: 100%;
            justify-content: center;
          }

          .handle-box strong {
            font-size: 22px;
          }

          .handle-input {
            font-size: 22px;
          }

          .phone-input {
            width: 100%;
          }

          .footer {
            margin-top: 72px;
          }
        }
      `}</style>

      <header className="topbar">
        <div className="brand">
          <span className="material-symbols-outlined brand-logo">diamond</span>
          <span className="brand-text">BondKeeper</span>
        </div>

        <nav className="main-nav" aria-label="Main">
          <button type="button" onClick={onNavigateDashboard}>Dashboard</button>
          <button type="button" className="active" onClick={onNavigateCoupleShop}>Couple Shop</button>
          <button type="button" onClick={onNavigateMyRing}>My Ring</button>
          <button type="button" onClick={onNavigateCoupleProfile}>Couple Profile</button>
        </nav>

        <div className="top-actions">
          <button type="button" className="top-icon-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications_none</span>
          </button>
          <button type="button" className="top-icon-btn" aria-label="Theme">
            <span className="material-symbols-outlined">bedtime</span>
          </button>
          <button type="button" className="top-icon-btn" aria-label="Shopping cart">
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>
          <span className="divider" />
          <span className="profile-name">{profile.title || DEFAULT_PROFILE_NAME}</span>
          <span className="material-symbols-outlined profile-chevron" aria-hidden="true">expand_more</span>
          <img
            className="mini-avatar"
            src={resolveApiAssetUrl(avatarUrl) || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'}
            alt={profile.title || DEFAULT_PROFILE_NAME}
          />
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <div className="hero-avatar-wrap">
            {avatarUrl ? (
              <img className="hero-avatar" src={resolveApiAssetUrl(avatarUrl)} alt="Selected profile" />
            ) : (
              <div className="hero-avatar" />
            )}
            <button type="button" className="avatar-camera" onClick={handleOpenPicker}>
              {'\u{1F4F7}'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={handleAvatarChange}
            />
          </div>
          {isEditing ? (
            <>
              <input
                className="profile-input"
                value={draftProfile.title}
                onChange={(event) => setDraftProfile((prev) => ({ ...prev, title: event.target.value }))}
                aria-label="Profile title"
              />
              <input
                className="profile-input sub"
                value={draftProfile.togetherSince}
                onChange={(event) => setDraftProfile((prev) => ({ ...prev, togetherSince: event.target.value }))}
                aria-label="Together since text"
              />
            </>
          ) : (
            <>
              <h1>{profile.title} {'\u270E'}</h1>
              <p>{profile.togetherSince}</p>
            </>
          )}
          {error ? <p className="status-note error">{error}</p> : null}
          {!error && loading ? <p className="status-note">Loading profile...</p> : null}
          <div className="edit-actions">
            {isEditing ? (
              <>
                <button type="button" className="save-btn" onClick={handleSaveProfile} disabled={saving}>Save Changes</button>
                <button type="button" className="cancel-btn" onClick={handleCancelEdit} disabled={saving}>Discard</button>
              </>
            ) : (
              <button type="button" className="edit-btn" onClick={handleStartEdit} disabled={loading}>Edit Details</button>
            )}
          </div>
        </section>

        <section className="days-card">
          <div className="days-left">
            <div className="days-icon">{'\u2728'}</div>
            <div>
              <p className="days-label">Shared Journey</p>
              <p className="days-value">
                {profile.daysTogether} Day{profile.daysTogether === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div className="days-right">
            <div className="days-avatars">{'\u{1F468}\u{1F469}'}</div>
            <div className="days-link"><span className="days-dot" />{profile.linkedPartnerLabel}</div>
          </div>
        </section>

        <section className="grid">
          <article className="card feature-card link-card">
            <div className="card-head">
              <div className="feature-kicker">
                <div className="card-icon link">{'\u{1F517}'}</div>
                <div className="feature-copy">
                  <span className="feature-tag">Public Profile</span>
                  <h3>Shared Link</h3>
                </div>
              </div>
              <span className="feature-badge live">{isEditing ? 'EDITING' : 'LIVE'}</span>
            </div>
            <p>Choose a simple profile handle for your couple page.</p>
            <div className="handle-box">
              <span className="handle-prefix">{shareLinkBaseLabel}</span>
              {isEditing ? (
                <input
                  className="handle-input"
                  value={draftProfile.handle}
                  onChange={(event) => {
                    const nextHandle = sanitizeProfileHandle(event.target.value);
                    setDraftProfile((prev) => ({ ...prev, handle: nextHandle }));
                    setError('');
                    setShareMessage('');
                  }}
                  aria-label="Profile handle"
                  placeholder="your_shared_name"
                />
              ) : (
                <strong>{profile.handle}</strong>
              )}
            </div>
            <div className="link-meta">
              <div className={`handle-helper ${handleValidationMessage && isEditing ? 'error' : ''}`}>
                {isEditing
                  ? handleValidationMessage || 'Use 3-30 lowercase letters, numbers, hyphens, or underscores.'
                  : shareMessage || 'This link is now a real public page you can open or share.'}
              </div>
              <span className="feature-pill">Ready to share</span>
            </div>
            <div className="handle-actions">
              <button
                type="button"
                className="handle-action-btn primary"
                onClick={handleCopySharedLink}
                disabled={Boolean(handleValidationMessage) || !activeHandle}
              >
                Copy Link
              </button>
              <button
                type="button"
                className="handle-action-btn"
                onClick={handleOpenSharedLink}
                disabled={Boolean(handleValidationMessage) || !activeHandle}
              >
                Open Page
              </button>
            </div>
          </article>

          <article className="card feature-card phone-card">
            <div className="card-head">
              <div className="feature-kicker">
                <div className="card-icon phone">{'\u26E8'}</div>
                <div className="feature-copy">
                  <span className="feature-tag">Secure Access</span>
                  <h3>Phone Access</h3>
                </div>
              </div>
              <span className="verified">VERIFIED</span>
            </div>
            <p>Your number stays protected with two-factor verification.</p>
            <div className="phone-shell">
              <div className="phone-main">
                <span className="phone-label">Primary Number</span>
                <div className="phone-row">
                  {isEditing ? (
                    <input
                      className="phone-input"
                      value={draftProfile.phone}
                      onChange={(event) => setDraftProfile((prev) => ({ ...prev, phone: event.target.value }))}
                      aria-label="Phone number"
                    />
                  ) : (
                    <div className="phone-value">{profile.phone}</div>
                  )}
                </div>
                <span className="phone-caption">
                  {isEditing ? 'Save changes to update your protected recovery number.' : 'Stored to your profile and kept after refresh.'}
                </span>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  className="change-btn"
                  onClick={() => void handleQuickPhoneChange()}
                  disabled={isUpdatingPhone || loading || saving}
                >
                  {isUpdatingPhone ? 'Updating...' : 'Update Number'}
                </button>
              ) : null}
            </div>
          </article>
        </section>

        <section className="signout" role="button" tabIndex={0} onClick={handleSignOut} onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSignOut();
          }
        }}>
          <div className="signout-left">
            <div className="signout-icon">{'\u21AA'}</div>
            <div>
              <h4>Sign Out</h4>
              <p>Leave this device safely and keep your account protected.</p>
            </div>
          </div>
          <span className="signout-arrow">{'\u203A'}</span>
        </section>

        <footer className="footer">
          <div className="footer-links">
            <button type="button">Privacy Policy</button>
            <button type="button">Terms of Service</button>
            <button type="button">Help Center</button>
          </div>
          <p>{'\u00A9'} 2025 Eternal Rings. Crafted for couples who stay connected.</p>
        </footer>

        <ConfirmDialog
          isOpen={isSignOutConfirmOpen}
          title="Sign Out?"
          message="Are you sure you want to sign out from this device?"
          confirmLabel="Sign Out"
          cancelLabel="Stay Here"
          onConfirm={() => {
            void confirmSignOut();
          }}
          onClose={() => setIsSignOutConfirmOpen(false)}
        />
      </main>
    </div>
  );
};

export default ProfileView;
