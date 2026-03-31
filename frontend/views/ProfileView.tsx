import React from 'react';
import { Link } from 'react-router-dom';
import { api, resolveApiAssetUrl } from '../lib/api';
import { THEME_EVENT, isStoredDarkModeEnabled, setDarkModePreference } from '../lib/theme';
import { getUserScopedLocalStorageItem, getStoredAuthValue } from '../lib/userStorage';
import HistoryModal from './HistoryModal';

const PROFILE_STORAGE_KEY = 'bondkeeper_profile_persist_v1';
const USER_AVATAR_STORAGE_KEY = 'bondkeeper_user_avatar_url';
const USER_AVATAR_UPDATED_EVENT = 'bondkeeper:user-avatar-updated';
const USER_PROFILE_UPDATED_EVENT = 'bondkeeper:user-profile-updated';
const DEFAULT_PROFILE_NAME = 'Member';

const ProfileView = () => {
  const initialProfile = React.useMemo(() => ({
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
  const [profile, setProfile] = React.useState(initialProfile);
  const [draftProfile, setDraftProfile] = React.useState(initialProfile);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  const fileInputRef = React.useRef(null);

  // Load dark mode preference
  React.useEffect(() => {
    setIsDarkMode(isStoredDarkModeEnabled());
  }, []);

  React.useEffect(() => {
    const syncTheme = () => setIsDarkMode(isStoredDarkModeEnabled());
    window.addEventListener('storage', syncTheme);
    window.addEventListener(THEME_EVENT, syncTheme);
    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener(THEME_EVENT, syncTheme);
    };
  }, []);

  // Load cart count
  React.useEffect(() => {
    const syncCartCount = () => {
      try {
        const cart = JSON.parse(getUserScopedLocalStorageItem('cart') || '[]');
        setCartCount(cart.length);
      } catch {
        setCartCount(0);
      }
    };

    syncCartCount();
    window.addEventListener('cartUpdated', syncCartCount);
    return () => window.removeEventListener('cartUpdated', syncCartCount);
  }, []);

  const readPersistedProfile = React.useCallback(() => {
    try {
      const raw = getUserScopedLocalStorageItem(PROFILE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  const persistProfile = React.useCallback((data) => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore local storage write errors
    }
  }, []);

  const persistUserAvatar = React.useCallback((nextAvatarUrl) => {
    try {
      if (nextAvatarUrl) {
        localStorage.setItem(USER_AVATAR_STORAGE_KEY, nextAvatarUrl);
      } else {
        localStorage.removeItem(USER_AVATAR_STORAGE_KEY);
      }
      window.dispatchEvent(new Event(USER_AVATAR_UPDATED_EVENT));
    } catch {
      // Ignore local storage write errors
    }
  }, []);

  const syncProfileIdentity = React.useCallback((nextTitle) => {
    const normalizedTitle = String(nextTitle || '').trim() || DEFAULT_PROFILE_NAME;
    sessionStorage.setItem('auth_name', normalizedTitle);
    window.dispatchEvent(new Event(USER_PROFILE_UPDATED_EVENT));
  }, []);

  const applyProfile = React.useCallback((data) => {
    const next = {
      ...initialProfile,
      ...data,
    };
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
        const profileData = await api.get('/profile/me/current');
        const userData = rawUserId
          ? await api.get(`/users/${rawUserId}`).catch(() => null)
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
        } else {
          setError('');
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

  const handleAvatarChange = (event) => {
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
        const avatarResponse = await api.patch(`/users/${rawUserId}/avatar`, { avatarUrl });
        persistedAvatarUrl = avatarResponse?.avatarUrl || avatarUrl;
        persistUserAvatar(persistedAvatarUrl);
      }

      const savedProfile = await api.patch('/profile/me/current', {
        ...payload,
        avatarUrl: persistedAvatarUrl,
      });

      applyProfile({
        ...savedProfile,
        avatarUrl: persistedAvatarUrl || savedProfile.avatarUrl || '',
      });
      setIsEditing(false);
    } catch (err) {
      persistProfile(payload);
      applyProfile(payload);
      setIsEditing(false);
      setError('');
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
      // Clear client auth state
    } finally {
      ['auth_user_id', 'auth_roles', 'auth_session_token'].forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });
      window.location.reload();
    }
  };

  const handleThemeToggle = () => {
    const nextDarkMode = !isDarkMode;
    setIsDarkMode(nextDarkMode);
    setDarkModePreference(nextDarkMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark love-pattern-bg">
        <div className="flex items-center justify-center py-20">
          <div className="loading-spinner mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark love-pattern-bg">
      {/* History Modal */}
      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-charcoal/80 premium-blur border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
              <span className="heading-serif text-2xl font-semibold tracking-wide text-primary">BondKeeper</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
              <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/shop" className="hover:text-primary transition-colors">Couple Shop</Link>
              <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
              <Link to="/profile" className="text-primary border-b border-primary/40 pb-1">Couple Profile</Link>
              <Link to="/relationship" className="hover:text-primary transition-colors">Relationship</Link>
              <Link to="/settings" className="hover:text-primary transition-colors">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsHistoryModalOpen(true)} 
              className="relative text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors group"
            >
              <span className="material-symbols-outlined">history</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </button>
            <button onClick={handleThemeToggle} className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <Link to="/cart" className="relative">
              <button className="text-charcoal/60 hover:text-primary">
                <span className="material-symbols-outlined">shopping_cart</span>
              </button>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3 pl-2 border-l border-primary/20 text-pink-500">
              <span className="text-sm font-medium hidden sm:inline">{profile.title || DEFAULT_PROFILE_NAME}</span>
              <Link to="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section - Avatar */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 mx-auto text-pink-500">
              {avatarUrl ? (
                <img className="w-full h-full object-cover" src={resolveApiAssetUrl(avatarUrl)} alt="Profile" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary flex items-center justify-center text-pink-300">
                  <span className="material-symbols-outlined text-5xl text-white">person</span>
                </div>
              )}
            </div>
            <button 
              onClick={handleOpenPicker}
              className="absolute bottom-0 right-0 bg-primary text-pink-500 p-2 rounded-full shadow-lg hover:bg-primary/80 transition-colors "
            >
              <span className="material-symbols-outlined text-sm text-pink-300">camera_alt</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white dark:bg-surface-dark/80 rounded-3xl p-8 border border-primary/10 shadow-premium mb-8">
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">Couple Name</label>
                <input
                  className="w-full px-5 py-3 bg-pink-100 dark:bg-pink-80 border border-pink-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-pink-900 dark:text-white"
                  value={draftProfile.title}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">Together Since</label>
                <input
                  className="w-full px-5 py-3 bg-pink-100 dark:bg-pink-80 border border-pink-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-pink-900 dark:text-white"
                  value={draftProfile.togetherSince}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, togetherSince: event.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">Profile Handle</label>
                <div className="flex items-center text-pink-500">
                  <span className="text-slate-900 mr-2">eternalrings.app/u/</span>
                  <input
                    className="flex-1 px-5 py-3 bg-pink-100 dark:bg-pink-80 border border-pink-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-pink-900 dark:text-white"
                    value={draftProfile.handle}
                    onChange={(event) => setDraftProfile((prev) => ({ ...prev, handle: event.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">Phone Number</label>
                <input
                  className="w-full px-5 py-3 bg-pink-100 dark:bg-pink-80 border border-pink-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-pink-900 dark:text-white"
                  value={draftProfile.phone}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </div>
              <div className="flex gap-4">
                <button className="flex-1 bg-primary text-green-500 py-3 rounded-xl font-bold hover:bg-primary/80 transition-all" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="flex-1 border-2 border-primary text-red-500 py-3 rounded-xl font-bold hover:bg-primary/5 transition-all" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="heading-serif text-4xl md:text-5xl font-light mb-2 text-pink-500">{profile.title}</h1>
              <p className="text-primary text-lg mb-4">{profile.togetherSince}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 text-left">
                <div className="bg-pink-50 dark:bg-pink-80 rounded-2xl p-5">
                  <span className="material-symbols-outlined text-primary text-2xl mb-2">link</span>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Shared Link</p>
                  <p className="font-mono text-sm text-pink-500">eternalrings.app/u/{profile.handle}</p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-80 rounded-2xl p-5">
                  <span className="material-symbols-outlined text-primary text-2xl mb-2">phone</span>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="text-lg font-bold">{profile.phone}</p>
                  <p className="text-xs text-green-600 mt-1">✓ Verified</p>
                </div>
              </div>
              <button className="mt-8 px-8 py-3 bg-primary text-orange-700 rounded-xl font-bold hover:bg-primary/80 transition-all" onClick={handleStartEdit}>
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Days Together Card */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-3xl p-8 border border-primary/10 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">favorite</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Shared Journey</p>
                <p className="text-3xl font-bold text-primary">{profile.daysTogether} Days</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-2xl mb-2">
                <span>👨</span>
                <span className="text-primary">❤️</span>
                <span>👩</span>
              </div>
              <p className="text-sm text-slate-500">{profile.linkedPartnerLabel}</p>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button 
          className="w-full bg-white dark:bg-surface-dark/80 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-center justify-between hover:border-red-300 transition-all group"
          onClick={handleSignOut}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500">logout</span>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-lg text-red-500">Sign Out</h4>
              <p className="text-sm text-slate-500">Leave this device safely</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="flex justify-center gap-6 mb-4">
            <button className="text-xs text-slate-400 hover:text-primary transition-colors">Privacy Policy</button>
            <button className="text-xs text-slate-400 hover:text-primary transition-colors">Terms of Service</button>
            <button className="text-xs text-slate-400 hover:text-primary transition-colors">Help Center</button>
          </div>
          <p className="text-xs text-slate-400">© 2025 BondKeeper · Eternal Rings. Crafted for couples who stay connected.</p>
        </footer>
      </main>

      <style>{`
        .loading-spinner {
          border: 3px solid rgba(255,42,162,0.1);
          border-top: 3px solid #ff2aa2;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .premium-blur {
          backdrop-filter: blur(12px);
        }

        .love-pattern-bg {
          position: relative;
        }

        .love-pattern-bg::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background-image: radial-gradient(circle at 20% 40%, rgba(255,42,162,0.03) 0%, transparent 50%);
          z-index: 0;
        }

        .heading-serif {
          font-family: 'Times New Roman', Georgia, serif;
        }
      `}</style>
    </div>
  );
};

export default ProfileView;