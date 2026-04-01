import type { ChangeEvent, PropsWithChildren } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, API_BASE_URL, resolveApiAssetUrl } from '../lib/api';
import {
  getStoredAuthValue,
  getUserScopedLocalStorageItem,
  setUserScopedLocalStorageItem,
  removeUserScopedLocalStorageItem,
} from '../lib/userStorage';
const USER_AVATAR_STORAGE_KEY = 'bondkeeper_user_avatar_url';
const USER_AVATAR_UPDATED_EVENT = 'bondkeeper:user-avatar-updated';
const USER_PROFILE_UPDATED_EVENT = 'bondkeeper:user-profile-updated';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Couple Shop', path: '/shop' },
  { name: 'My Ring', path: '/myring' },
  { name: 'Couple Profile', path: '/couple-profile' },
  { name: 'Relationship', path: '/relationship' },
  { name: 'Settings', path: '/settings' },
];

function readStoredUserAvatar() {
  return getUserScopedLocalStorageItem(USER_AVATAR_STORAGE_KEY);
}

export default function UserShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [displayName, setDisplayName] = useState('Alex & Jamie');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => readStoredUserAvatar());
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState(
    'Hi Admin, I have completed my payment and would like to send my receipt for verification.',
  );
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [receiptName, setReceiptName] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState('');
  const messagePanelRef = useRef<HTMLDivElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const authName = sessionStorage.getItem('auth_name')?.trim();
    setDisplayName(authName || 'Member');
  }, []);

  useEffect(() => {
    let active = true;

    const syncAvatarFromStorage = () => {
      if (!active) return;
      setAvatarUrl(readStoredUserAvatar());
      setDisplayName(sessionStorage.getItem('auth_name')?.trim() || 'Member');
    };

    const loadCurrentUserProfile = async () => {
      const rawUserId = getStoredAuthValue('auth_user_id');
      if (!rawUserId) {
        syncAvatarFromStorage();
        return;
      }

      try {
        const user = await api.get<{ fullName: string; avatarUrl: string | null }>(`/users/${rawUserId}`);
        if (!active) return;

        setDisplayName(user.fullName || sessionStorage.getItem('auth_name')?.trim() || 'Member');
        setAvatarUrl(user.avatarUrl || null);
        try {
          if (user.avatarUrl) {
            setUserScopedLocalStorageItem(USER_AVATAR_STORAGE_KEY, user.avatarUrl);
          } else {
            removeUserScopedLocalStorageItem(USER_AVATAR_STORAGE_KEY);
          }
        } catch {
          // Ignore local storage write errors.
        }
      } catch {
        syncAvatarFromStorage();
      }
    };

    void loadCurrentUserProfile();

    window.addEventListener('focus', syncAvatarFromStorage);
    window.addEventListener('storage', syncAvatarFromStorage);
    window.addEventListener(USER_AVATAR_UPDATED_EVENT, syncAvatarFromStorage);
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, syncAvatarFromStorage);

    return () => {
      active = false;
      window.removeEventListener('focus', syncAvatarFromStorage);
      window.removeEventListener('storage', syncAvatarFromStorage);
      window.removeEventListener(USER_AVATAR_UPDATED_EVENT, syncAvatarFromStorage);
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, syncAvatarFromStorage);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (messagePanelRef.current && !messagePanelRef.current.contains(target)) {
        setIsMessageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const sessionId = getUserScopedLocalStorageItem('sessionId');
        if (sessionId) {
          const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: {
              'x-session-id': sessionId,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setCartCount(Array.isArray(data.data) ? data.data.length : 0);
            return;
          }
        }

        const storedCart = JSON.parse(getUserScopedLocalStorageItem('cart') || '[]');
        setCartCount(Array.isArray(storedCart) ? storedCart.length : 0);
      } catch {
        setCartCount(0);
      }
    };

    void updateCartCount();

    const handleCartUpdate = () => {
      void updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const navItems = useMemo(() => NAV_ITEMS, []);

  const handleMessageAdmin = () => {
    setIsMessageOpen((current) => !current);
    setMessageFeedback('');
  };

  const handleReceiptUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessageFeedback('Please upload an image receipt.');
      event.target.value = '';
      return;
    }

    const maxSizeBytes = 4 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setMessageFeedback('Receipt image must be 4 MB or smaller.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setMessageFeedback('Could not read the uploaded image.');
        return;
      }

      setReceiptPreview(reader.result);
      setReceiptName(file.name);
      setMessageFeedback('');
    };
    reader.onerror = () => {
      setMessageFeedback('Could not read the uploaded image.');
    };
    reader.readAsDataURL(file);
  };

  const sendMessageToAdmin = async () => {
    const text = messageDraft.trim();
    if (!text && !receiptPreview) {
      setMessageFeedback('Please type a message or attach a receipt image.');
      return;
    }

    setIsSendingMessage(true);
    setMessageFeedback('');

    try {
      const payload = {
        subject: 'Receipt verification request',
        message: text,
        attachment: receiptPreview || undefined,
        attachmentName: receiptName || undefined,
      };

      const sendSupportMessage = async (path: string) =>
        api.post<{ created?: number; totalAdmins?: number }>(path, payload);

      let response;
      try {
        response = await sendSupportMessage('/notifications/support-message');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
        if (errorMessage.includes('route not found')) {
          response = await sendSupportMessage('/support-message');
        } else {
          throw error;
        }
      }

      const created = Number(response?.created || 0);
      const totalAdmins = Number(response?.totalAdmins || 0);
      setMessageFeedback(
        created > 0
          ? `Sent to ${created}${totalAdmins > 1 ? ' admin accounts' : ' admin account'}.`
          : 'Message sent.',
      );
      setMessageDraft(
        'Hi Admin, I have completed my payment and would like to send my receipt for verification.',
      );
      setReceiptPreview('');
      setReceiptName('');
      if (receiptInputRef.current) {
        receiptInputRef.current.value = '';
      }
      window.dispatchEvent(new Event('bondkeeper:support-message-sent'));
    } catch (error) {
      setMessageFeedback(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-charcoal dark:text-white">
      <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/95 backdrop-blur dark:border-slate-700/70 dark:bg-slate-950/95">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-6 md:px-8">
          <div className="flex min-w-0 items-center gap-6 lg:gap-10">
            <Link to="/dashboard" className="flex shrink-0 items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[28px]">diamond</span>
              <span className="heading-serif text-2xl font-semibold tracking-tight">BondKeeper</span>
            </Link>

            {/* Navigation Links - Desktop */}
            <nav className="hidden lg:flex items-center gap-5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === item.path
                      ? 'text-primary border-b-2 border-primary pb-1'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3 md:gap-5">
            <div className="relative" ref={messagePanelRef}>
              <button
                type="button"
                aria-label="Message admin"
                className="flex items-center gap-2 rounded-full border border-[#ece7ed] px-4 py-2 text-[#27272a] transition-colors hover:border-[#f542a7] hover:text-[#f542a7] dark:border-slate-700 dark:text-slate-200"
                onClick={handleMessageAdmin}
              >
                <span className="material-symbols-outlined text-[22px] leading-none">chat_bubble</span>
                <span className="text-sm font-medium">Message admin</span>
              </button>

              {isMessageOpen && (
                <div className="absolute right-0 top-14 z-50 w-[360px] rounded-2xl border border-[#ece7ed] bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-3">
                  <p className="text-sm font-bold text-[#27272a] dark:text-slate-100">Send a receipt message</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This will appear in the admin inbox for verification.
                  </p>
                </div>
                <textarea
                    className="min-h-[140px] w-full resize-none rounded-xl border border-[#ece7ed] bg-white px-3 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#f542a7] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    placeholder="Write your message to the admin..."
                  />
                  <div className="mt-3">
                    <input
                      ref={receiptInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => receiptInputRef.current?.click()}
                      className="w-full rounded-xl border border-dashed border-[#ece7ed] px-3 py-3 text-left text-sm font-semibold text-slate-600 transition-colors hover:border-[#f542a7] hover:text-[#f542a7] dark:border-slate-700 dark:text-slate-300"
                    >
                      {receiptName ? `Attached receipt: ${receiptName}` : 'Attach receipt image'}
                    </button>
                    {receiptPreview && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-[#ece7ed] dark:border-slate-700">
                        <img src={receiptPreview} alt="Receipt preview" className="h-40 w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setMessageDraft(
                          'Hi Admin, I have completed my payment and would like to send my receipt for verification.',
                        )
                      }
                      className="text-xs font-semibold text-slate-500 hover:text-[#f542a7]"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendMessageToAdmin()}
                      disabled={isSendingMessage}
                      className="rounded-full bg-[#f542a7] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e11d76] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSendingMessage ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  {messageFeedback && <p className="mt-2 text-xs text-slate-500">{messageFeedback}</p>}
                </div>
              )}
            </div>

            <Link to="/cart" className="relative text-slate-500 transition-colors hover:text-primary dark:text-slate-200">
              <span className="material-symbols-outlined">shopping_cart</span>
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            <div className="hidden h-8 w-px bg-primary/15 dark:bg-slate-600/70 sm:block" />

            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-medium text-slate-800 dark:text-slate-100 md:inline">
                {displayName}
              </span>
              <Link to="/profile" aria-label="Profile">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/70 to-primary text-white shadow-md shadow-primary/15">
                  {avatarUrl ? (
                    <img src={resolveApiAssetUrl(avatarUrl)} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <nav className="lg:hidden bg-white dark:bg-slate-900 border-b border-primary/10 dark:border-slate-700/70 overflow-x-auto">
        <div className="flex px-4 py-2 space-x-4 min-w-max">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary px-2 py-1 ${
                location.pathname === item.path
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      <div className="user-shell-content">
        {children}
      </div>

      <style>{`
        .user-shell-content {
          min-height: calc(100vh - 5rem);
          background:
            radial-gradient(circle at top, rgba(236, 19, 128, 0.08), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .dark .user-shell-content {
          background:
            radial-gradient(circle at top, rgba(236, 19, 128, 0.16), transparent 28%),
            linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #e5e7eb;
        }

        .user-shell-content > header.sticky,
        .user-shell-content header.sticky.top-0.z-50.w-full,
        .user-shell-content .topbar {
          display: none !important;
        }

        .dark .user-shell-content > div,
        .dark .user-shell-content > main,
        .dark .user-shell-content > section {
          background-color: transparent;
        }

        .dark .user-shell-content .bg-background-light,
        .dark .user-shell-content .bg-cream,
        .dark .user-shell-content .bg-slate-50,
        .dark .user-shell-content .bg-white {
          background-color: #0f172a !important;
        }

        .dark .user-shell-content footer.bg-white,
        .dark .user-shell-content footer.bg-background-dark,
        .dark .user-shell-content footer.bg-charcoal {
          background-color: #111827 !important;
        }

        .dark .user-shell-content .bg-slate-50\\/50,
        .dark .user-shell-content .bg-slate-100,
        .dark .user-shell-content .bg-primary\\/5,
        .dark .user-shell-content .bg-white\\/70,
        .dark .user-shell-content .bg-white\\/80,
        .dark .user-shell-content .bg-white\\/95 {
          background-color: #1f2937 !important;
        }

        .dark .user-shell-content .border-slate-50,
        .dark .user-shell-content .border-slate-100,
        .dark .user-shell-content .border-slate-200,
        .dark .user-shell-content .border-primary\\/10,
        .dark .user-shell-content .border-primary\\/20 {
          border-color: #374151 !important;
        }

        .dark .user-shell-content .text-slate-900,
        .dark .user-shell-content .text-slate-800,
        .dark .user-shell-content .text-black,
        .dark .user-shell-content .dark\\:text-black {
          color: #f8fafc !important;
        }

        .dark .user-shell-content .text-slate-700,
        .dark .user-shell-content .text-slate-600,
        .dark .user-shell-content .text-slate-500,
        .dark .user-shell-content .text-slate-400,
        .dark .user-shell-content .text-charcoal\\/60,
        .dark .user-shell-content .dark\\:text-slate-500,
        .dark .user-shell-content .dark\\:text-black {
          color: #94a3b8 !important;
        }

        .dark .user-shell-content input,
        .dark .user-shell-content select,
        .dark .user-shell-content textarea {
          background-color: #111827;
          color: #f8fafc;
          border-color: #374151;
        }

        .user-shell-content .profile-page .wrap {
          padding-top: 48px;
        }
      `}</style>
    </div>
  );
}
