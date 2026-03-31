import React from 'react';
import { Link } from 'react-router-dom';
import { api, resolveApiAssetUrl } from '../lib/api';
import { THEME_EVENT, isStoredDarkModeEnabled, setDarkModePreference } from '../lib/theme';
import { getUserScopedLocalStorageItem } from '../lib/userStorage';
import HistoryModal from './HistoryModal';

type ProfilePayload = {
  title?: string;
  handle?: string;
  avatarUrl?: string | null;
};

type ConnectionPayload = {
  success?: boolean;
  connection?: {
    pairId?: number | null;
    establishedAt?: string | null;
    pairCode?: string | null;
    pair_code?: string | null;
    partners?: Array<{
      name?: string | null;
      email?: string | null;
      avatar?: string | null;
    }>;
  } | null;
};

type Invitation = {
  id: number;
  type: 'sent' | 'received';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
  respondedAt: string | null;
  user: {
    id: number | null;
    email: string;
    name: string | null;
    avatar: string | null;
  };
};

type InvitationListPayload = {
  success?: boolean;
  invitations?: {
    sent: Invitation[];
    received: Invitation[];
  };
};

type SearchResult = {
  id: number;
  email: string;
  displayName: string;
  avatar: string | null;
  accountStatus: string;
};

type SearchPayload = {
  success?: boolean;
  users?: SearchResult[];
};

const RelationshipView = ({
  onNavigateSettings = () => {},
  onNavigateCoupleProfile = () => {},
  onNavigateProfile = () => {}
}) => {
  const [access, setAccess] = React.useState('REVOKED');
  const [pairCode, setPairCode] = React.useState('PAIR001');
  const [status, setStatus] = React.useState('UNPAIRED');
  const [visibility, setVisibility] = React.useState('partners');
  const [ringInput, setRingInput] = React.useState('');
  const [linkedRings, setLinkedRings] = React.useState<string[]>([]);
  const [cartCount, setCartCount] = React.useState(0);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [primaryName, setPrimaryName] = React.useState('Member');
  const [primaryHandle, setPrimaryHandle] = React.useState('member');
  const [primaryAvatar, setPrimaryAvatar] = React.useState('');
  const [partnerName, setPartnerName] = React.useState('Partner');
  const [partnerHandle, setPartnerHandle] = React.useState('partner');
  const [partnerAvatar, setPartnerAvatar] = React.useState('');
  const [establishedDate, setEstablishedDate] = React.useState('1/1/2025');
  const [daysTogetherLabel, setDaysTogetherLabel] = React.useState('1y 53d together');
  const [inviteQuery, setInviteQuery] = React.useState('');
  const [inviteRingId, setInviteRingId] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isSendingInvite, setIsSendingInvite] = React.useState(false);
  const [inviteMessage, setInviteMessage] = React.useState('');
  const [inviteMessageTone, setInviteMessageTone] = React.useState<'success' | 'error' | ''>('');
  const [invitations, setInvitations] = React.useState<{ sent: Invitation[]; received: Invitation[] }>({
    sent: [],
    received: []
  });
  const [loadingInvitations, setLoadingInvitations] = React.useState(true);
  const [connectionLoaded, setConnectionLoaded] = React.useState(false);
  const [isUnpairing, setIsUnpairing] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);

  const applyConnectionData = React.useCallback((connection: ConnectionPayload['connection']) => {
    const formatHandle = (value: string) =>
      String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || 'member';

    const formatDateLabel = (value: string | null | undefined) => {
      if (!value) return '1/1/2025';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '1/1/2025';
      return date.toLocaleDateString();
    };

    const formatDaysTogether = (value: string | null | undefined) => {
      if (!value) return 'Not paired yet';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Not paired yet';
      const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
      return `${days} day${days === 1 ? '' : 's'} together`;
    };

    if (!connection) return;

    const establishedAt = connection.establishedAt || null;
    setPairCode(connection.pairCode || connection.pair_code || 'PAIR001');
    setEstablishedDate(formatDateLabel(establishedAt));
    setDaysTogetherLabel(formatDaysTogether(establishedAt));
    setStatus('PAIRED');

    const partner = Array.isArray(connection.partners) ? connection.partners[0] : null;
    if (partner) {
      const nextPartnerName = partner.name || partner.email?.split('@')[0] || 'Partner';
      setPartnerName(nextPartnerName);
      setPartnerHandle(formatHandle(nextPartnerName));
      if (partner.avatar) {
        setPartnerAvatar(resolveApiAssetUrl(partner.avatar));
      }
    }
  }, []);

  const refreshConnection = React.useCallback(async () => {
    try {
      const connectionData = await api.get<ConnectionPayload>('/pairs/my-connection');
      applyConnectionData(connectionData?.connection || null);
    } catch {
      // Keep current values if connection refresh fails.
    } finally {
      setConnectionLoaded(true);
    }
  }, [applyConnectionData]);

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

  React.useEffect(() => {
    const formatHandle = (value: string) =>
      String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || 'member';

    const loadProfileCardData = async () => {
      try {
        const profile = await api.get<ProfilePayload>('/profile/me/current');
        setPrimaryName(profile.title || 'Member');
        setPrimaryHandle(formatHandle(profile.handle || profile.title || 'member'));
        if (profile.avatarUrl) {
          setPrimaryAvatar(resolveApiAssetUrl(profile.avatarUrl));
        }
      } catch {
        // Keep fallback values.
      }

      await refreshConnection();
    };

    void loadProfileCardData();
  }, [refreshConnection]);

  React.useEffect(() => {
    const loadInvitations = async () => {
      try {
        const result = await api.get<InvitationListPayload>('/pair-invitations/my-invitations');
        if (result?.success && result.invitations) {
          setInvitations(result.invitations);
        }
      } catch {
        // Keep empty invitation state.
      } finally {
        setLoadingInvitations(false);
      }
    };

    void loadInvitations();
  }, []);

  React.useEffect(() => {
    const searchUsers = async () => {
      const query = inviteQuery.trim();
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const result = await api.get<SearchPayload>(`/pair-invitations/search-users?q=${encodeURIComponent(query)}`);
        setSearchResults(Array.isArray(result?.users) ? result.users : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = window.setTimeout(() => {
      void searchUsers();
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [inviteQuery]);

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

  const handleUnpair = () => {
    setAccess('REVOKED');
    setStatus('UNPAIRED');
    setPairCode('UNPAIRED');
    setEstablishedDate('Not paired');
    setDaysTogetherLabel('Not paired yet');
    setPartnerName('Partner');
    setPartnerHandle('partner');
    setLinkedRings([]);
  };

  const handleConfirmUnpair = async () => {
    setIsUnpairing(true);

    try {
      const result = await api.delete<{ success?: boolean; message?: string }>('/pairs/my-connection');
      handleUnpair();
      setInviteMessage(result?.message || 'Relationship unpaired successfully.');
      setInviteMessageTone('success');
      await refreshInvitations();
      await refreshConnection();
    } catch (error: any) {
      setInviteMessage(error instanceof Error ? error.message : 'Failed to unpair relationship');
      setInviteMessageTone('error');
    } finally {
      setIsUnpairing(false);
    }
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmLabel = 'Confirm') => {
    setConfirmDialog({ title, message, onConfirm, confirmLabel });
  };

  const handleSaveVisibility = () => {
    if (visibility === 'public') {
      setStatus('PUBLIC');
      return;
    }

    if (visibility === 'partners') {
      setStatus('PARTNERS');
      return;
    }

    setStatus('PRIVATE');
  };

  const handleAddRing = () => {
    const next = ringInput.trim();
    if (!next) return;
    setLinkedRings((current) => [...current, next]);
    setRingInput('');
  };

  const handleThemeToggle = () => {
    const nextDarkMode = !isDarkMode;
    setIsDarkMode(nextDarkMode);
    setDarkModePreference(nextDarkMode);
  };

  const refreshInvitations = async () => {
    const result = await api.get<InvitationListPayload>('/pair-invitations/my-invitations');
    if (result?.success && result.invitations) {
      setInvitations(result.invitations);
    }
  };

  const handleSendInvite = async (targetEmail?: string) => {
    const inviteeEmail = (targetEmail || inviteQuery).trim();
    if (!inviteeEmail) {
      setInviteMessage('Enter a partner email or choose a profile first.');
      setInviteMessageTone('error');
      return;
    }

    setIsSendingInvite(true);
    setInviteMessage('');
    setInviteMessageTone('');

    try {
      const result = await api.post<{ success?: boolean; message?: string }>('/pair-invitations/send', {
        inviteeEmail,
        inviteeRingIdentifier: inviteRingId.trim() || undefined
      });
      setInviteMessage(result?.message || `Invitation sent to ${inviteeEmail}`);
      setInviteMessageTone('success');
      setInviteQuery('');
      setInviteRingId('');
      setSearchResults([]);
      await refreshInvitations();
    } catch (error: any) {
      setInviteMessage(error instanceof Error ? error.message : 'Failed to send invitation');
      setInviteMessageTone('error');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleInvitationAction = async (action: 'accept' | 'reject' | 'cancel', invitationId: number) => {
    try {
      await api.post(`/pair-invitations/${invitationId}/${action}`, {});
      setInvitations((current) => ({
        sent: current.sent.filter((item) => item.id !== invitationId),
        received: current.received.filter((item) => item.id !== invitationId)
      }));
      setInviteMessage(
        action === 'accept'
          ? 'Invitation accepted. Your relationship is now connected.'
          : action === 'reject'
            ? 'Invitation rejected.'
            : 'Invitation cancelled.'
      );
      setInviteMessageTone('success');
      if (action === 'accept') {
        await refreshInvitations();
        await refreshConnection();
      }
    } catch (error: any) {
      setInviteMessage(error instanceof Error ? error.message : `Failed to ${action} invitation`);
      setInviteMessageTone('error');
    }
  };

  const handleCopyMyId = async () => {
    const value = primaryHandle ? `@${primaryHandle}` : primaryName;
    try {
      await navigator.clipboard.writeText(value);
      setInviteMessage(`Copied ${value} to clipboard.`);
      setInviteMessageTone('success');
    } catch {
      setInviteMessage('Could not copy automatically. Please copy your ID manually.');
      setInviteMessageTone('error');
    }
  };

  const pendingInvitations = [...invitations.received, ...invitations.sent].filter((item) => item.status === 'PENDING');
  const hasRelationship = status === 'PAIRED' || status === 'PUBLIC' || status === 'PARTNERS' || status === 'PRIVATE';

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
              <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
              <Link to="/relationship" className="text-primary border-b border-primary/40 pb-1">Relationship</Link>
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
              <span className="material-symbols-outlined">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
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
            <div className="flex items-center gap-3 pl-2 border-l border-primary/20">
              <span className="text-sm font-medium hidden sm:inline">{primaryName}</span>
              <Link to="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {connectionLoaded && !hasRelationship && (
          <div className="bg-white dark:bg-surface-dark/80 rounded-3xl p-8 border border-primary/10 shadow-premium">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold">✦ Always & Forever</span>
              <h1 className="heading-serif text-5xl font-light mt-2">Start Your Journey Together</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl mx-auto">
                Connect with your partner to create your digital relationship certificate and celebrate your love.
                Once linked, you can document milestones and share your story.
              </p>
            </div>

            {/* Invite Section */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-primary mb-4">Invite by ID or Email</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  className="flex-1 px-5 py-3 bg-pink-100 dark:bg-pink-80 border border-pink-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-gray-700 dark:text-white"
                  value={inviteQuery}
                  onChange={(event) => setInviteQuery(event.target.value)}
                  placeholder="Search by Partner ID or email"
                />
                <button 
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/80 transition-all"
                  type="button" 
                  disabled={isSendingInvite} 
                  onClick={() => void handleSendInvite()}
                >
                  {isSendingInvite ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
              {inviteMessage && <div className={`mt-3 text-sm ${inviteMessageTone === 'success' ? 'text-green-600' : 'text-red-600'}`}>{inviteMessage}</div>}

              {/* Search Results */}
              {(isSearching || searchResults.length > 0) && (
                <div className="mt-4 space-y-2">
                  {isSearching && <div className="text-slate-500">Searching partners...</div>}
                  {!isSearching && searchResults.map((user) => (
                    <div className="flex items-center justify-between p-4 bg-pink-50 dark:bg-pink-80 rounded-xl" key={user.id}>
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img className="w-10 h-10 rounded-full object-cover" src={resolveApiAssetUrl(user.avatar)} alt={user.displayName} />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user.displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-800 dark:text-white">{user.displayName}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                      <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold" type="button" onClick={() => void handleSendInvite(user.email)}>
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Invitations */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-primary">Pending Invitations</h3>
                <span className="text-sm text-slate-500">{loadingInvitations ? 'Loading...' : `${pendingInvitations.length} request${pendingInvitations.length === 1 ? '' : 's'}`}</span>
              </div>
              <div className="bg-pink-50 dark:bg-pink-80 rounded-2xl p-6 min-h-[200px]">
                {loadingInvitations ? (
                  <div className="text-center py-8">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading invitations...</p>
                  </div>
                ) : pendingInvitations.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">mail_outline</span>
                    <h4 className="text-xl font-bold mb-2">No pending invites yet</h4>
                    <p className="text-slate-500 mb-4">When you receive or send a partner request, it will appear here.</p>
                    <div className="flex gap-3 justify-center">
                      <button className="px-4 py-2 border border-primary/30 rounded-lg text-primary font-bold" type="button">How it works</button>
                      <button className="px-4 py-2 bg-primary text-white rounded-lg font-bold" type="button" onClick={() => void handleCopyMyId()}>Copy My ID</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 rounded-xl ${invitation.type === 'received' ? 'bg-white dark:bg-slate-800' : 'bg-white/50 dark:bg-slate-800/50'}`} key={`${invitation.type}-${invitation.id}`}>
                        <div className="flex items-center gap-3">
                          {invitation.user.avatar ? (
                            <img className="w-10 h-10 rounded-full object-cover" src={resolveApiAssetUrl(invitation.user.avatar)} alt={invitation.user.name || invitation.user.email} />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                              {(invitation.user.name || invitation.user.email || '?').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-800 dark:text-white">{invitation.user.name || invitation.user.email}</div>
                            <div className="text-sm text-slate-500">{invitation.user.email}</div>
                            <div className="text-xs text-primary mt-1">{invitation.type === 'received' ? 'Waiting for you' : 'Waiting for them'}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {invitation.type === 'received' ? (
                            <>
                              <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold" type="button" onClick={() => void handleInvitationAction('accept', invitation.id)}>Accept</button>
                              <button className="px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-bold" type="button" onClick={() => void handleInvitationAction('reject', invitation.id)}>Reject</button>
                            </>
                          ) : (
                            <button className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg text-sm font-bold" type="button" onClick={() => void handleInvitationAction('cancel', invitation.id)}>Cancel Request</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary">lock</span>
                  <h4 className="font-bold text-primary">Privacy First</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Only you and your partner can see your shared certificate and timeline data.</p>
              </div>
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary">celebration</span>
                  <h4 className="font-bold text-primary">Digital Milestone</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Capture a unique digital keepsake that grows with your relationship over time.</p>
              </div>
            </div>
          </div>
        )}

        {hasRelationship && (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold">✦ Relationship Certificate</span>
              <h1 className="heading-serif text-5xl font-light mt-2">Live Relationship Profile</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Connected partner details synced from your database and pair settings.</p>
              <span className="inline-block mt-4 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold">{pairCode}</span>
            </div>

            {/* Certificate Card */}
            <div className="bg-white dark:bg-surface-dark/80 rounded-3xl p-8 border border-primary/10 shadow-premium mb-8">
              {/* Identity Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Primary Profile */}
                <div className="text-center">
                  <img className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-primary/20" src={primaryAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80'} alt={primaryName} />
                  <h2 className="text-2xl font-bold mt-3 text-gray-800 dark:text-white">{primaryName}</h2>
                  <p className="text-sm text-slate-500">@{primaryHandle}</p>
                  <p className="text-xs text-primary mt-1">Primary Profile</p>
                </div>

                {/* Center Heart */}
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <span className="material-symbols-outlined text-4xl">favorite</span>
                  </div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Established</p>
                  <p className="text-2xl font-bold text-primary">{establishedDate}</p>
                  <p className="text-sm text-slate-500">{daysTogetherLabel}</p>
                </div>

                {/* Partner Profile */}
                <div className="text-center">
                  <img className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-primary/20" src={partnerAvatar || 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&w=240&q=80'} alt={partnerName} />
                  <h2 className="text-2xl font-bold mt-3 text-gray-800 dark:text-white">{partnerName}</h2>
                  <p className="text-sm text-slate-500">@{partnerHandle}</p>
                  <p className="text-xs text-primary mt-1">Linked Partner</p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pair Metadata Card */}
                <div className="bg-pink-50 dark:bg-pink-80 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-primary mb-4">Pair Metadata</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Access</label>
                      <select className="w-full px-4 py-2 rounded-lg border border-pink-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={access} onChange={(event) => setAccess(event.target.value)}>
                        <option value="GRANTED">GRANTED</option>
                        <option value="REVOKED">REVOKED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Code</label>
                      <input className="w-full px-4 py-2 rounded-lg border border-pink-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={pairCode} onChange={(event) => setPairCode(event.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Status</label>
                      <select className="w-full px-4 py-2 rounded-lg border border-pink-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={status} onChange={(event) => setStatus(event.target.value)}>
                        <option value="PAIRED">PAIRED</option>
                        <option value="UNPAIRED">UNPAIRED</option>
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="PARTNERS">PARTNERS</option>
                        <option value="PRIVATE">PRIVATE</option>
                      </select>
                    </div>
                  </div>
                  <button className="w-full mt-6 px-6 py-3 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all" type="button" onClick={() => showConfirm('Unpair Relationship', 'Are you sure you want to unpair this relationship?', () => { void handleConfirmUnpair(); }, 'Unpair')}>
                    Unpair Relationship
                  </button>
                </div>

                {/* Privacy Vault Card */}
                <div className="bg-pink-50 dark:bg-pink-80 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-primary mb-4">Privacy Vault</h3>
                  <p className="text-xs text-slate-500 mb-4">Visibility mode from proximity preferences.</p>
                  <div className="space-y-3">
                    <label className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${visibility === 'public' ? 'bg-primary/10 border border-primary' : 'bg-white dark:bg-slate-800'}`}>
                      <span>Public Presence</span>
                      <input type="radio" name="visibility" value="public" checked={visibility === 'public'} onChange={(event) => setVisibility(event.target.value)} className="text-primary" />
                    </label>
                    <label className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${visibility === 'partners' ? 'bg-primary/10 border border-primary' : 'bg-white dark:bg-slate-800'}`}>
                      <span>Partners Only</span>
                      <input type="radio" name="visibility" value="partners" checked={visibility === 'partners'} onChange={(event) => setVisibility(event.target.value)} className="text-primary" />
                    </label>
                    <label className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${visibility === 'private' ? 'bg-primary/10 border border-primary' : 'bg-white dark:bg-slate-800'}`}>
                      <span>Private</span>
                      <input type="radio" name="visibility" value="private" checked={visibility === 'private'} onChange={(event) => setVisibility(event.target.value)} className="text-primary" />
                    </label>
                  </div>
                  <button className="w-full mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all" type="button" onClick={handleSaveVisibility}>
                    Save Visibility
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-primary/10 my-8"></div>

              {/* Linked Rings Section */}
              <div>
                <h3 className="text-xl font-bold text-primary mb-4">Linked Rings</h3>
                <div className="bg-pink-50 dark:bg-pink-80 rounded-2xl p-6 mb-4 min-h-[80px] flex items-center justify-center">
                  <p className="text-slate-500">{linkedRings.length === 0 ? 'No rings linked.' : `${linkedRings.length} ring(s) linked.`}</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <input className="flex-1 px-4 py-3 rounded-lg border border-pink-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={ringInput} onChange={(event) => setRingInput(event.target.value)} placeholder="Enter ring ID" />
                  <button className="px-6 py-3 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all" type="button" onClick={handleAddRing}>
                    Add Ring
                  </button>
                </div>
                {linkedRings.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {linkedRings.map((ring) => (
                      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full" key={ring}>
                        <span className="text-sm text-primary">{ring}</span>
                        <button className="text-primary hover:text-primary/80" type="button" onClick={() => setLinkedRings((current) => current.filter((item) => item !== ring))}>
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <p className="text-center text-xs text-slate-400 mt-12">Built for two • forever connected</p>
      </main>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-charcoal rounded-2xl max-w-md w-full p-6 shadow-2xl border border-primary/20">
            <h3 className="text-2xl font-bold text-primary mb-4">{confirmDialog.title}</h3>
            <p className="text-slate-600 dark:text-cream/70 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors" type="button" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors" type="button" disabled={isUnpairing} onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>
                {isUnpairing ? 'Unpairing...' : confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

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
      `}</style>
    </div>
  );
};

export default RelationshipView;