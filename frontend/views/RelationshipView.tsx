import React from 'react';
import { Link } from 'react-router-dom';
import { api, resolveApiAssetUrl } from '../lib/api';
import { THEME_EVENT, isStoredDarkModeEnabled, setDarkModePreference } from '../lib/theme';
import { getUserScopedLocalStorageItem } from '../lib/userStorage';

type ProfilePayload = {
  title?: string;
  handle?: string;
  avatarUrl?: string | null;
};

type ConnectionPayload = {
  success?: boolean;
  connection?: {
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
  const [cartCount, setCartCount] = React.useState(4);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [primaryName, setPrimaryName] = React.useState('Member');
  const [primaryHandle, setPrimaryHandle] = React.useState('member');
  const [primaryAvatar, setPrimaryAvatar] = React.useState(
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80'
  );
  const [partnerName, setPartnerName] = React.useState('Partner');
  const [partnerHandle, setPartnerHandle] = React.useState('partner');
  const [partnerAvatar, setPartnerAvatar] = React.useState(
    'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&w=240&q=80'
  );
  const [establishedDate, setEstablishedDate] = React.useState('1/1/2025');
  const [daysTogetherLabel, setDaysTogetherLabel] = React.useState('1y 53d together');

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

      try {
        const connectionData = await api.get<ConnectionPayload>('/pairs/my-connection');
        const connection = connectionData?.connection;
        if (!connection) return;

        const establishedAt = connection.establishedAt || null;
        setPairCode(connection.pairCode || connection.pair_code || 'PAIR001');
        setEstablishedDate(formatDateLabel(establishedAt));
        setDaysTogetherLabel(formatDaysTogether(establishedAt));

        const partner = Array.isArray(connection.partners) ? connection.partners[0] : null;
        if (partner) {
          const nextPartnerName = partner.name || partner.email?.split('@')[0] || 'Partner';
          setPartnerName(nextPartnerName);
          setPartnerHandle(formatHandle(nextPartnerName));
          if (partner.avatar) {
            setPartnerAvatar(resolveApiAssetUrl(partner.avatar));
          }
        }
      } catch {
        // Keep fallback values.
      }
    };

    void loadProfileCardData();
  }, []);

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

  return (
    <div className="relationship-page">
      <style>{`
        .relationship-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 100% -8%, rgba(255, 42, 162, 0.12), transparent 36%),
            radial-gradient(circle at -10% 110%, rgba(255, 42, 162, 0.08), transparent 34%),
            #faf6f2;
          color: #1e1b1a;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }
        .dark .relationship-page {
          background:
            radial-gradient(circle at 100% -8%, rgba(255, 42, 162, 0.1), transparent 36%),
            radial-gradient(circle at -10% 110%, rgba(255, 42, 162, 0.06), transparent 34%),
            #1e1b1a;
          color: rgba(250, 246, 242, 0.9);
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        .relationship-wrap {
          max-width: 1120px;
          margin: 0 auto;
          padding: 58px 20px 56px;
        }
        

        .hero {
          text-align: center;
          margin-bottom: 40px;
        }

        .label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 15px;
          border-radius: 999px;
          border: 1px solid rgba(255, 42, 162, 0.3);
          background: rgba(255, 42, 162, 0.08);
          color: #ff2aa2;
          text-transform: uppercase;
          letter-spacing: 0.24em;
          font-size: 11px;
          font-weight: 900;
        }

        .hero h1 {
          margin: 16px 0 10px;
          font-size: clamp(38px, 5.2vw, 58px);
          letter-spacing: -0.04em;
          font-weight: 800;
          color: #1e1b1a;
          line-height: 1.06;
          text-wrap: balance;
        }
        .dark .hero h1 { color: rgba(250, 246, 242, 0.95); }

        .hero p {
          margin: 0;
          color: #6b7280;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.45;
        }
        .dark .hero p { color: rgba(250, 246, 242, 0.6); }

        .pair-code {
          margin-top: 18px;
          display: inline-block;
          border: 1px solid rgba(255, 42, 162, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.6);
          color: #6b7280;
          padding: 7px 14px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .dark .pair-code {
          border-color: rgba(255, 42, 162, 0.25);
          background: rgba(0, 0, 0, 0.2);
          color: rgba(250, 246, 242, 0.6);
        }

        .certificate {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(250, 246, 242, 0.9));
          border-radius: 28px;
          border: 1px solid rgba(255, 42, 162, 0.15);
          box-shadow: 0 20px 42px rgba(0, 0, 0, 0.06);
          padding: 44px;
          position: relative;
          overflow: hidden;
        }
        .dark .certificate {
          background: linear-gradient(180deg, rgba(40, 38, 37, 0.95), rgba(30, 27, 26, 0.9));
          border-color: rgba(255, 42, 162, 0.2);
          box-shadow: 0 20px 42px rgba(0, 0, 0, 0.3);
        }

        .certificate::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, rgba(255, 42, 162, 0.6), rgba(255, 42, 162, 0.3));
        }

        .identity {
          display: grid;
          grid-template-columns: minmax(240px, 1fr) minmax(200px, auto) minmax(240px, 1fr);
          gap: 22px;
          align-items: stretch;
          justify-items: center;
          margin-bottom: 52px;
          border: 1px solid rgba(255, 42, 162, 0.15);
          border-radius: 26px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(250, 246, 242, 0.8));
          padding: 22px;
        }
        .dark .identity {
          border-color: rgba(255, 42, 162, 0.2);
          background: linear-gradient(180deg, rgba(50, 47, 46, 0.9), rgba(30, 27, 26, 0.9));
        }

        .user {
          text-align: center;
          width: 100%;
          border: 1px solid rgba(255, 42, 162, 0.14);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(254, 248, 251, 0.82));
          padding: 20px 14px 16px;
          display: grid;
          justify-items: center;
          gap: 4px;
        }
        .dark .user {
          border-color: rgba(255, 42, 162, 0.24);
          background: linear-gradient(180deg, rgba(58, 53, 56, 0.92), rgba(35, 30, 34, 0.9));
        }

        .avatar {
          width: 108px;
          height: 108px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 1px rgba(255, 42, 162, 0.28), 0 10px 22px rgba(0, 0, 0, 0.12);
          object-fit: cover;
          margin-bottom: 8px;
        }

        .user-name {
          margin: 0;
          font-size: clamp(34px, 4vw, 50px);
          font-weight: 850;
          color: #1e1b1a;
          letter-spacing: -0.03em;
          line-height: 1.04;
        }
        .dark .user-name { color: rgba(250, 246, 242, 0.95); }

        .user-handle {
          color: #5b6f86;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.2;
        }
        .dark .user-handle { color: rgba(250, 246, 242, 0.62); }

        .user-role {
          margin-top: 2px;
          color: #7f8fa5;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 800;
        }
        .dark .user-role { color: rgba(250, 246, 242, 0.48); }

        .center-info {
          text-align: center;
          width: 100%;
          border: 1px dashed rgba(255, 42, 162, 0.28);
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(255, 242, 250, 0.85), rgba(255, 248, 252, 0.65));
          padding: 18px 14px;
          display: grid;
          align-content: center;
          gap: 4px;
        }
        .dark .center-info {
          border-color: rgba(255, 42, 162, 0.34);
          background: linear-gradient(180deg, rgba(63, 43, 57, 0.76), rgba(39, 30, 37, 0.68));
        }

        .center-heart {
          width: 64px;
          height: 64px;
          border: 1px solid rgba(255, 42, 162, 0.3);
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #ff2aa2;
          margin: 0 auto 12px;
          font-size: 30px;
          background: linear-gradient(180deg, rgba(255, 42, 162, 0.08), rgba(255, 42, 162, 0.12));
          box-shadow: inset 0 0 0 1px rgba(255, 42, 162, 0.2), 0 10px 20px rgba(255, 42, 162, 0.15);
        }

        .center-info .kicker {
          margin: 0;
          color: #6b7280;
          letter-spacing: 0.17em;
          text-transform: uppercase;
          font-weight: 900;
          font-size: 14px;
        }
        .dark .center-info .kicker { color: rgba(250, 246, 242, 0.5); }

        .center-info .date {
          margin: 5px 0 0;
          color: #1e1b1a;
          font-size: clamp(32px, 3.4vw, 44px);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }
        .dark .center-info .date { color: rgba(250, 246, 242, 0.95); }

        .center-info .days {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }
        .dark .center-info .days { color: rgba(250, 246, 242, 0.6); }

        .grid-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
          margin-bottom: 42px;
        }

        .card {
          border: 1px solid rgba(255, 42, 162, 0.15);
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(250, 246, 242, 0.85));
          min-height: 360px;
          padding: 32px;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dark .card {
          border-color: rgba(255, 42, 162, 0.2);
          background: linear-gradient(180deg, rgba(50, 47, 46, 0.95), rgba(30, 27, 26, 0.9));
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.3);
        }

        .card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 42, 162, 0.25);
          box-shadow: 0 18px 36px rgba(255, 42, 162, 0.12);
        }

        .card h4 {
          margin: 0;
          font-size: 34px;
          font-weight: 900;
          color: #1e1b1a;
          margin-bottom: 10px;
          letter-spacing: -0.03em;
        }
        .dark .card h4 { color: rgba(250, 246, 242, 0.95); }

        .meta {
          margin-top: 18px;
          display: grid;
          gap: 12px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #6b7280;
          font-size: 14px;
          gap: 14px;
        }
        .dark .row { color: rgba(250, 246, 242, 0.6); }

        .row span {
          min-width: 74px;
          font-weight: 700;
        }

        .field-input,
        .field-select {
          flex: 1;
          height: 42px;
          border-radius: 9px;
          border: 1px solid rgba(255, 42, 162, 0.2);
          background: rgba(255, 255, 255, 0.8);
          color: #1e1b1a;
          padding: 0 10px;
          font-size: 13px;
          font-weight: 800;
          font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .dark .field-input,
        .dark .field-select {
          border-color: rgba(255, 42, 162, 0.3);
          background: rgba(0, 0, 0, 0.2);
          color: rgba(250, 246, 242, 0.9);
        }

        .field-input:hover,
        .field-select:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(255, 42, 162, 0.3);
        }

        .field-input:focus,
        .field-select:focus {
          outline: none;
          border-color: #ff2aa2;
          box-shadow: 0 0 0 3px rgba(255, 42, 162, 0.2);
        }

        .outline-btn,
        .solid-btn {
          margin-top: 22px;
          border-radius: 12px;
          font-weight: 900;
          padding: 11px 22px;
          cursor: pointer;
          font-size: 14px;
          font-family: inherit;
          transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease;
        }

        .outline-btn {
          border: 1.5px solid #ff2aa2;
          color: #ff2aa2;
          background: rgba(255, 42, 162, 0.08);
          width: 180px;
          box-shadow: inset 0 0 0 1px rgba(255, 42, 162, 0.2);
        }

        .helper {
          margin: 6px 0 0;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 11px;
          font-weight: 800;
        }
        .dark .helper { color: rgba(250, 246, 242, 0.5); }

        .options {
          margin-top: 18px;
          display: grid;
          gap: 11px;
        }

        .option {
          position: relative;
          height: 46px;
          border-radius: 12px;
          border: 1px solid rgba(255, 42, 162, 0.2);
          background: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px 0 14px;
          color: #4b5563;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
        }
        .dark .option {
          border-color: rgba(255, 42, 162, 0.25);
          background: rgba(0, 0, 0, 0.2);
          color: rgba(250, 246, 242, 0.8);
        }

        .option:hover {
          border-color: rgba(255, 42, 162, 0.3);
          background: rgba(255, 42, 162, 0.05);
        }

        .option input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .option .dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(255, 42, 162, 0.4);
          display: grid;
          place-items: center;
        }

        .option.active {
          border-color: #ff2aa2;
          color: #1e1b1a;
          background: rgba(255, 42, 162, 0.1);
          box-shadow: inset 0 0 0 1px rgba(255, 42, 162, 0.25);
        }
        .dark .option.active { color: rgba(250, 246, 242, 0.95); }

        .option.active .dot {
          border-color: #ff2aa2;
          background: #ff2aa2;
        }

        .option.active .dot::after {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
        }

        .linked-controls {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .ring-input {
          flex: 1;
          min-width: 0;
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(255, 42, 162, 0.2);
          background: rgba(255, 255, 255, 0.8);
          padding: 0 12px;
          font-size: 14px;
          color: #1e1b1a;
          font-family: inherit;
        }
        .dark .ring-input {
          border-color: rgba(255, 42, 162, 0.3);
          background: rgba(0, 0, 0, 0.2);
          color: rgba(250, 246, 242, 0.9);
        }

        .ring-input:focus {
          outline: none;
          border-color: #ff2aa2;
          box-shadow: 0 0 0 3px rgba(255, 42, 162, 0.2);
        }

        .ring-add-btn {
          border: 1px solid #ff2aa2;
          background: rgba(255, 42, 162, 0.08);
          color: #ff2aa2;
          height: 44px;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          box-shadow: inset 0 0 0 1px rgba(255, 42, 162, 0.2);
        }

        .ring-list {
          margin: 10px 0 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ring-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255, 42, 162, 0.2);
          border-radius: 999px;
          background: rgba(255, 42, 162, 0.06);
          padding: 6px 10px;
          font-size: 12px;
          color: #1e1b1a;
          font-weight: 700;
        }
        .dark .ring-item { color: rgba(250, 246, 242, 0.9); }

        .ring-remove {
          border: 0;
          background: transparent;
          color: #ff2aa2;
          cursor: pointer;
          font-size: 12px;
          font-weight: 900;
          padding: 0;
        }

        .solid-btn {
          border: 1px solid transparent;
          background: linear-gradient(180deg, #ff2aa2, #e91a8a);
          color: #fff;
          width: 160px;
          box-shadow: 0 9px 20px rgba(255, 42, 162, 0.3);
        }

        .outline-btn:hover,
        .solid-btn:hover,
        .ring-add-btn:hover {
          transform: translateY(-1px);
          filter: saturate(1.03);
        }

        .divider {
          height: 1px;
          background: rgba(255, 42, 162, 0.15);
          margin-bottom: 32px;
        }

        .linked h5 {
          margin: 0 0 14px;
          font-size: 30px;
          color: #1e1b1a;
          font-weight: 900;
        }
        .dark .linked h5 { color: rgba(250, 246, 242, 0.95); }

        .linked-box {
          min-height: 92px;
          border-radius: 22px;
          border: 1px dashed rgba(255, 42, 162, 0.25);
          color: #6b7280;
          background: rgba(255, 42, 162, 0.04);
          display: grid;
          place-items: center;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .dark .linked-box {
          border-color: rgba(255, 42, 162, 0.3);
          background: rgba(255, 42, 162, 0.06);
          color: rgba(250, 246, 242, 0.5);
        }

        .footer {
          margin-top: 48px;
          text-align: center;
          color: rgba(255, 42, 162, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.45em;
          font-size: 11px;
          font-weight: 800;
        }

        @media (max-width: 1024px) {
          .relationship-wrap {
            padding: 40px 14px 30px;
          }

          .hero h1 {
            font-size: clamp(32px, 8.4vw, 56px);
          }

          .hero p {
            font-size: 18px;
          }

          .identity {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 32px;
            padding: 18px 14px;
          }

          
          .user span,
          .center-heart,
          .center-info .date,
          .card h4,
          .row,
          .outline-btn,
          .option,
          .solid-btn,
          .linked h5 {
            transform: none;
            width: auto;
            margin: 0;
            font-size: inherit;
          }

          .grid-cards {
            grid-template-columns: 1fr;
          }

          .card {
            min-height: auto;
            padding: 20px 16px;
          }

          .card h4 {
            font-size: 28px;
            margin-bottom: 8px;
          }

          .user-name { font-size: clamp(30px, 7vw, 44px); }

          .row {
            font-size: 14px;
          }

          .helper {
            font-size: 11px;
          }

          .option {
            font-size: 14px;
            height: 44px;
            margin-bottom: 0;
          }

          .outline-btn,
          .solid-btn {
            width: 100%;
            font-size: 15px;
            margin-top: 14px;
          }

          .linked h5 {
            font-size: 28px;
            margin-bottom: 10px;
          }
        }

        @media (max-width: 640px) {
          .certificate {
            border-radius: 18px;
            padding: 16px 12px;
          }

          .hero {
            margin-bottom: 30px;
          }

          .label {
            padding: 6px 10px;
            font-size: 10px;
            letter-spacing: 0.13em;
          }

          .pair-code {
            margin-top: 12px;
            font-size: 9px;
            padding: 6px 10px;
          }

          .footer {
            margin-top: 30px;
            letter-spacing: 0.18em;
            font-size: 9px;
          }
        }
      `}</style>

      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-charcoal/80 premium-blur border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
              <span className="heading-serif text-2xl font-semibold tracking-wide text-primary">BondKeeper</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
              <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/shop" className="hover:text-primary transition-colors">Couple Shop</Link>
              <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
              <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
              <Link to="/relationship" className="text-primary border-b border-primary/40 pb-1">Relationship</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications_none</span>
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
              <span className="text-sm font-medium hidden sm:inline">Alex & Jamie</span>
              <Link to="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relationship-wrap">
        <section className="hero">
          <span className="label">{'\u2726'} Always & Forever</span>
          <h1>Relationship Certificate</h1>
          <p>Live relationship profile from your database.</p>
          <span className="pair-code">{pairCode}</span>
        </section>

        <section className="certificate">
          <div className="identity">
            <article className="user">
              <img
                className="avatar"
                src={primaryAvatar}
                alt={primaryName}
              />
             <h2 className="user-name">{primaryName}</h2>
              <span className="user-handle">@{primaryHandle}</span>
              <p className="user-role">Primary Profile</p>
            </article>

            <article className="center-info">
              <div className="center-heart">{'\u2764'}</div>
              <p className="kicker">Established</p>
              <p className="date">{establishedDate}</p>
              <p className="days">{daysTogetherLabel}</p>
            </article>

            <article className="user">
              <img
                className="avatar"
                src={partnerAvatar}
                alt={partnerName}
              />
             <h2 className="user-name">{partnerName}</h2>
              <span className="user-handle">@{partnerHandle}</span>
              <p className="user-role">Linked Partner</p>
            </article>
          </div>

          <div className="grid-cards">
            <section className="card">
              <h4>Pair Metadata</h4>
              <div className="meta">
                <label className="row">
                  <span>Access:</span>
                  <select
                    className="field-select"
                    value={access}
                    onChange={(event) => setAccess(event.target.value)}
                  >
                    <option value="GRANTED">GRANTED</option>
                    <option value="REVOKED">REVOKED</option>
                  </select>
                </label>
                <label className="row">
                  <span>Code:</span>
                  <input
                    className="field-input"
                    value={pairCode}
                    onChange={(event) => setPairCode(event.target.value.toUpperCase())}
                  />
                </label>
                <label className="row">
                  <span>Status:</span>
                  <select
                    className="field-select"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="PAIRED">PAIRED</option>
                    <option value="UNPAIRED">UNPAIRED</option>
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="PARTNERS">PARTNERS</option>
                    <option value="PRIVATE">PRIVATE</option>
                  </select>
                </label>
              </div>
              <button className="outline-btn" type="button" onClick={handleUnpair}>
                Unpair Relationship
              </button>
            </section>

            <section className="card">
              <h4>Privacy Vault</h4>
              <p className="helper">Visibility mode from 'proximity_preferences'.</p>
              <div className="options">
                <label className={`option ${visibility === 'public' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={(event) => setVisibility(event.target.value)}
                  />
                  <span>Public Presence</span>
                  <span className="dot" />
                </label>
                <label className={`option ${visibility === 'partners' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value="partners"
                    checked={visibility === 'partners'}
                    onChange={(event) => setVisibility(event.target.value)}
                  />
                  <span>Partners Only</span>
                  <span className="dot" />
                </label>
                <label className={`option ${visibility === 'private' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={(event) => setVisibility(event.target.value)}
                  />
                  <span>Private</span>
                  <span className="dot" />
                </label>
              </div>
              <button className="solid-btn" type="button" onClick={handleSaveVisibility}>
                Save Visibility
              </button>
            </section>
          </div>

          <div className="divider" />

          <section className="linked">
            <h5>Linked Rings</h5>
            <div className="linked-box">
              {linkedRings.length === 0 ? 'No rings linked.' : `${linkedRings.length} ring(s) linked.`}
            </div>
            <div className="linked-controls">
              <input
                className="ring-input"
                value={ringInput}
                onChange={(event) => setRingInput(event.target.value)}
                placeholder="Enter ring id"
              />
              <button className="ring-add-btn" type="button" onClick={handleAddRing}>
                Add Ring
              </button>
            </div>
            {linkedRings.length > 0 && (
              <ul className="ring-list">
                {linkedRings.map((ring) => (
                  <li className="ring-item" key={ring}>
                    <span>{ring}</span>
                    <button
                      className="ring-remove"
                      type="button"
                      onClick={() => setLinkedRings((current) => current.filter((item) => item !== ring))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>

        <p className="footer">Built for two {'\u2022'} forever connected</p>
      </main>
    </div>
  );
};

export default RelationshipView;
