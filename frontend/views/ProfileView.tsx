import React from 'react';
import { api, resolveApiAssetUrl } from '../lib/api';
import {
  getStoredAuthValue,
  getUserScopedLocalStorageItem,
  removeUserScopedLocalStorageItem,
  setUserScopedLocalStorageItem,
} from '../lib/userStorage';

const PROFILE_STORAGE_KEY = 'bondkeeper_profile_persist_v1';
const USER_AVATAR_STORAGE_KEY = 'bondkeeper_user_avatar_url';
const USER_AVATAR_UPDATED_EVENT = 'bondkeeper:user-avatar-updated';
const USER_PROFILE_UPDATED_EVENT = 'bondkeeper:user-profile-updated';
const DEFAULT_PROFILE_NAME = 'Member';

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
    handle: String(source.handle || fallback.handle).trim() || fallback.handle,
    phone: String(source.phone || fallback.phone).trim() || fallback.phone,
    avatarUrl: String(source.avatarUrl || '').trim(),
    linkedPartnerLabel:
      String(source.linkedPartnerLabel || fallback.linkedPartnerLabel).trim() || fallback.linkedPartnerLabel,
    daysTogether: Number.isFinite(daysTogether) && daysTogether >= 0 ? daysTogether : fallback.daysTogether,
  };
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
  const [error, setError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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
    setProfile(next);
    setDraftProfile(next);
    setAvatarUrl(next.avatarUrl || '');
    persistProfile(next);
    syncProfileIdentity(next.title);
  }, [initialProfile, persistProfile, syncProfileIdentity]);

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

  const handleStartEdit = () => {
    setDraftProfile(profile);
    setAvatarUrl(profile.avatarUrl || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    const payload = {
      ...draftProfile,
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
    } catch (err) {
      // Keep local changes on the device, but be explicit when sync failed.
      persistProfile(normalizeProfileData(payload, initialProfile));
      applyProfile(payload);
      setIsEditing(false);
      setError('Changes were saved on this device, but the server sync failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftProfile(profile);
    setAvatarUrl(profile.avatarUrl || '');
    setIsEditing(false);
  };

  const handleQuickPhoneChange = () => {
    const next = window.prompt('Update your phone number', profile.phone);
    if (next === null) return;
    const value = next.trim();
    if (!value) return;
    const nextProfile = { ...profile, phone: value };
    setProfile(nextProfile);
    setDraftProfile(nextProfile);
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out from this device?');
    if (!confirmed) return;

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
          right: -2px;
          bottom: 12px;
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

        .card-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 18px;
        }

        .card-icon.link {
          background: #eaf1ff;
          color: #2b67ef;
        }

        .card-icon.phone {
          background: #e8f8ee;
          color: #1caa66;
        }

        .verified {
          border-radius: 999px;
          background: #dff7e9;
          color: #23a464;
          font-size: 11px;
          font-weight: 900;
          padding: 4px 10px;
          letter-spacing: 0.02em;
        }

        .card h3 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.03em;
          color: #16243e;
        }

        .card p {
          margin: 8px 0 18px;
          color: #6e819c;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 600;
        }

        .handle-box {
          min-height: 52px;
          border: 1px solid #d4ddec;
          border-radius: 999px;
          background: linear-gradient(180deg, #f8fbff, #eef3fb);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          color: #8093a9;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
        }

        .handle-box strong {
          color: #15233e;
          font-size: 17px;
          letter-spacing: -0.02em;
        }

        .handle-input {
          border: 0;
          background: transparent;
          color: #15233e;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.02em;
          width: 100%;
          min-width: 0;
          outline: none;
          font-family: inherit;
        }

        .phone-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .phone-value {
          color: #16243e;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .phone-input {
          border: 1px solid #d8e0ec;
          border-radius: 10px;
          background: #fff;
          color: #16243e;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.02em;
          height: 48px;
          padding: 0 12px;
          width: min(100%, 320px);
          font-family: inherit;
        }

        .change-btn {
          border: 0;
          border-radius: 999px;
          height: 40px;
          padding: 0 16px;
          background: linear-gradient(180deg, #fff0f3, #ffe7ed);
          color: #ef2f5a;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
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
        .dark .change-btn,
        .dark .signout p {
          color: #94a3b8;
        }

        .dark .profile-input,
        .dark .phone-input,
        .dark .handle-box,
        .dark .cancel-btn {
          background: #111827;
          border-color: #374151;
        }

        .dark .cancel-btn {
          color: #e5e7eb;
        }

        .dark .verified {
          background: rgba(34, 197, 94, 0.12);
          color: #86efac;
        }

        .dark .card-icon.link {
          background: rgba(59, 130, 246, 0.16);
          color: #93c5fd;
        }

        .dark .card-icon.phone {
          background: rgba(34, 197, 94, 0.16);
          color: #86efac;
        }

        .dark .days-icon,
        .dark .change-btn {
          background: rgba(236, 19, 128, 0.12);
          color: #f472b6;
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

          .phone-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .handle-box strong {
            font-size: 16px;
          }

          .handle-input {
            font-size: 16px;
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
          <article className="card">
            <div className="card-head">
              <div className="card-icon link">{'\u{1F517}'}</div>
            </div>
            <h3>Shared Link</h3>
            <p>Choose a simple profile handle for your couple page.</p>
            <div className="handle-box">
              <span>eternalrings.app/u/</span>
              {isEditing ? (
                <input
                  className="handle-input"
                  value={draftProfile.handle}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, handle: event.target.value }))}
                  aria-label="Profile handle"
                />
              ) : (
                <strong>{profile.handle}</strong>
              )}
            </div>
          </article>

          <article className="card">
            <div className="card-head">
              <div className="card-icon phone">{'\u26E8'}</div>
              <span className="verified">VERIFIED</span>
            </div>
            <h3>Phone Access</h3>
            <p>Your number stays protected with two-factor verification.</p>
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
              <button type="button" className="change-btn" onClick={handleQuickPhoneChange}>Update Number</button>
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
      </main>
    </div>
  );
};

export default ProfileView;
