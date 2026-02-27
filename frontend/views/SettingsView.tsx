import React from 'react';

const PROFILE_AVATAR_STORAGE_KEY = 'eternal_rings_profile_avatar';
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80';

const menuItems = ['General', 'Security & Privacy', 'Help & Support'];
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

const SettingsView = ({
  onNavigateRelationship = () => {},
  onNavigateCoupleProfile = () => {},
  onNavigateProfile = () => {}
}) => {
  const [activeMenu, setActiveMenu] = React.useState('General');
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const [privacyLevel, setPrivacyLevel] = React.useState('Contacts');
  const [themeMode, setThemeMode] = React.useState('Light');
  const [anniversaryReminders, setAnniversaryReminders] = React.useState(true);
  const [systemUpdates, setSystemUpdates] = React.useState(false);
  const [autoSync, setAutoSync] = React.useState(true);
  const [language, setLanguage] = React.useState('English (US)');
  const [globalMute, setGlobalMute] = React.useState(false);
  const [dndEnabled, setDndEnabled] = React.useState(true);
  const [repeatDaily, setRepeatDaily] = React.useState(true);
  const [emailPrefs, setEmailPrefs] = React.useState({
    weeklyWrap: true,
    productTips: false,
    occasionReminders: true,
    partnerAlerts: true
  });
  const [navAvatar, setNavAvatar] = React.useState(() => {
    try {
      return localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY) || DEFAULT_AVATAR;
    } catch {
      return DEFAULT_AVATAR;
    }
  });

  React.useEffect(() => {
    const syncAvatar = () => {
      try {
        setNavAvatar(localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY) || DEFAULT_AVATAR);
      } catch {
        setNavAvatar(DEFAULT_AVATAR);
      }
    };

    window.addEventListener('focus', syncAvatar);
    window.addEventListener('storage', syncAvatar);
    return () => {
      window.removeEventListener('focus', syncAvatar);
      window.removeEventListener('storage', syncAvatar);
    };
  }, []);

  return (
    <div className="settings-page">
      <style>{`
        :root {
          --bg: #f7f8fb;
          --panel: #ffffff;
          --line: #e6ebf2;
          --muted: #7788a3;
          --text: #17233a;
          --accent: #f03255;
          --accent-soft: #fff1f4;
          --success: #d8f7e3;
        }

        * {
          box-sizing: border-box;
        }

        .settings-page {
          min-height: 100vh;
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family: Manrope, 'Segoe UI', sans-serif;
        }

        .topbar {
          height: 72px;
          border-bottom: 1px solid #dde3ec;
          background: #f4f5f7;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 15;
          gap: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 180px;
          white-space: nowrap;
        }

        .brand-logo {
          color: #ef2f5a;
          font-size: 26px;
          line-height: 1;
        }

        .brand-text {
          color: #0f1934;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.035em;
        }

        .main-nav {
          margin-top: 20px;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 26px;
          display: flex;
          justify-content: center;
        }

        .main-nav button {
          border: 0;
          background: transparent;
          color: #6f7f99;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 2px 18px;
          position: relative;
          white-space: nowrap;
        }

        .main-nav button.active {
          color: #ef2f5a;
        }

        .main-nav button.active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 2px;
          height: 2px;
          border-radius: 999px;
          background: #ef2f5a;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 206px;
          justify-content: flex-end;
        }

        .unlink-pill {
          border: 1.4px solid #ef2f5a;
          color: #ef2f5a;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fff3f6;
          line-height: 1;
        }

        .top-icon {
          color: #61718d;
          font-size: 20px;
          line-height: 1;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #d4dbe6;
          object-fit: cover;
          cursor: pointer;
        }

        .page-body {
          max-width: 1320px;
          margin: 0 auto;
          padding: 34px 22px 24px;
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 30px;
        }

        .sidebar {
          min-height: 900px;
          display: flex;
          flex-direction: column;
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
          gap: 8px;
        }

        .menu-btn {
          width: 100%;
          border: 1px solid transparent;
          background: transparent;
          border-radius: 999px;
          height: 48px;
          padding: 0 14px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
          color: #334965;
          cursor: pointer;
        }

        .menu-btn span:first-child {
          font-size: 17px;
          line-height: 1;
        }

        .menu-btn.active {
          color: #fff;
          background: linear-gradient(180deg, #f23857, #eb264b);
          box-shadow: 0 10px 20px rgba(240, 50, 85, 0.25);
        }

        .premium-card {
          margin-top: auto;
          border: 1px solid #f0cbd3;
          border-radius: 18px;
          background: #fff6f7;
          padding: 16px;
        }

        .premium-card h4 {
          margin: 0;
          font-size: 15px;
          color: var(--accent);
          font-weight: 900;
        }

        .premium-card p {
          margin: 8px 0 14px;
          color: #8596af;
          font-size: 13px;
          font-weight: 600;
        }

        .premium-card button {
          width: 100%;
          height: 40px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(180deg, #f23857, #ea2449);
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .content {
          min-width: 0;
        }

        .content-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
        }

        .head-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
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
        }

        .save-btn {
          border: 0;
          height: 42px;
          border-radius: 999px;
          padding: 0 28px;
          background: linear-gradient(180deg, #f23857, #ea2449);
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 8px 18px rgba(240, 50, 85, 0.24);
          cursor: pointer;
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
          font-size: clamp(42px, 4.1vw, 58px);
          letter-spacing: -0.03em;
          line-height: 1;
          font-weight: 800;
          color: #131f37;
        }

        .subheading {
          margin: 10px 0 28px;
          max-width: 760px;
          color: #69809f;
          font-size: 16px;
          line-height: 1.42;
          font-weight: 600;
        }

        .general-heading {
          margin: 0;
          font-size: clamp(34px, 3.2vw, 54px);
          letter-spacing: -0.03em;
          line-height: 1.04;
          font-weight: 800;
          color: #131f37;
        }

        .general-subheading {
          margin: 8px 0 0;
          color: #7589a2;
          font-size: 17px;
          line-height: 1.4;
          font-weight: 600;
        }

        .general-stack {
          display: grid;
          gap: 20px;
        }

        .general-card {
          border: 1px solid #e2e8f1;
          border-radius: 20px;
          background: #fff;
          padding: 24px;
        }

        .general-card h3 {
          margin: 0;
          font-size: 19px;
          color: #162540;
          letter-spacing: -0.01em;
        }

        .general-icon {
          color: var(--accent);
          margin-right: 8px;
          font-size: 18px;
        }

        .theme-switch {
          margin-top: 18px;
          width: min(100%, 620px);
          background: #edf2f8;
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
          box-shadow: 0 2px 8px rgba(16, 30, 54, 0.08);
        }

        .setting-row {
          margin-top: 16px;
          background: #f5f8fc;
          border-radius: 999px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
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
          gap: 20px;
        }

        .search-input {
          margin-top: 18px;
          height: 48px;
          border: 0;
          width: 100%;
          border-radius: 999px;
          background: #edf2f8;
          color: #7d8ea8;
          font-size: 15px;
          font-weight: 600;
          padding: 0 16px;
          outline: none;
        }

        .language-list {
          margin-top: 14px;
          display: grid;
          gap: 8px;
        }

        .language-btn {
          border: 0;
          background: transparent;
          color: #6d7f99;
          font-size: 16px;
          font-weight: 700;
          text-align: left;
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
        }

        .language-btn.active {
          background: #ffeef2;
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .data-box {
          margin-top: 18px;
          border: 2px dashed #f2c1ca;
          border-radius: 18px;
          padding: 18px;
          background: #fff8f9;
        }

        .data-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .data-top h4 {
          margin: 0;
          color: #1b2a45;
          font-size: 18px;
        }

        .data-top p {
          margin: 10px 0 0;
          color: #7489a4;
          font-size: 15px;
          line-height: 1.42;
          font-weight: 600;
          max-width: 420px;
        }

        .sync-meta {
          margin-top: 12px;
          color: var(--accent);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .download-btn {
          margin-top: 16px;
          width: 100%;
          border: 0;
          background: transparent;
          color: var(--accent);
          font-size: 20px;
          font-weight: 800;
          text-align: center;
          cursor: pointer;
          padding: 10px 0 0;
        }

        .danger-card {
          border: 1px solid #f2ccd3;
          border-radius: 20px;
          background: #fff;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
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
          height: 48px;
          padding: 0 26px;
          font-size: 20px;
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
          border-radius: 28px;
          background: var(--panel);
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
          width: 44px;
          height: 26px;
          border: 1px solid #d6dfec;
          border-radius: 999px;
          background: #e9eef5;
          position: relative;
          cursor: pointer;
        }

        .toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(20, 32, 54, 0.2);
          transition: transform 0.2s ease;
        }

        .toggle.on {
          background: #f24361;
          border-color: #f24361;
        }

        .toggle.on::after {
          transform: translateX(18px);
        }

        .wizard-btn {
          border: 0;
          height: 46px;
          border-radius: 999px;
          padding: 0 20px;
          background: linear-gradient(180deg, #f23857, #ea2449);
          color: #fff;
          font-size: 20px;
          font-weight: 800;
          cursor: pointer;
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
          padding: 2px 2px 10px;
        }

        .security-screen .crumbs {
          margin-bottom: 12px;
          color: #7e8faa;
        }

        .security-screen .heading {
          font-size: clamp(36px, 3.3vw, 50px);
          line-height: 1.03;
          letter-spacing: -0.032em;
          margin-bottom: 8px;
        }

        .security-screen .subheading {
          margin: 0 0 24px;
          max-width: 860px;
          color: #6f839e;
          font-size: 16px;
        }

        .security-screen .main-grid {
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 26px;
        }

        .security-screen .left-stack,
        .security-screen .right-stack {
          gap: 18px;
        }

        .security-screen .card {
          border: 1px solid #e3e9f2;
          border-radius: 24px;
          background: linear-gradient(180deg, #ffffff, #fbfcff);
          box-shadow: 0 12px 26px rgba(30, 53, 96, 0.08);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .security-screen .card:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(23, 44, 82, 0.1);
        }

        .security-screen .two-factor {
          padding: 24px;
          align-items: flex-start;
          gap: 22px;
        }

        .security-screen .shield {
          width: 52px;
          height: 52px;
          background: linear-gradient(180deg, #fff2f6, #ffe9ef);
          box-shadow: inset 0 0 0 1px #ffd5df;
        }

        .security-screen .two-factor h3,
        .security-screen .sessions h3,
        .security-screen .side-panel h3 {
          font-size: 22px;
          color: #12213f;
          letter-spacing: -0.02em;
        }

        .security-screen .two-factor p {
          margin-top: 8px;
          color: #657a96;
          font-size: 15px;
          line-height: 1.5;
        }

        .security-screen .action-row {
          gap: 10px;
          align-self: center;
        }

        .security-screen .toggle {
          width: 48px;
          height: 28px;
          border: 1px solid #d6dfec;
          background: #e8edf5;
        }

        .security-screen .toggle::after {
          width: 22px;
          height: 22px;
        }

        .security-screen .toggle.on::after {
          transform: translateX(20px);
        }

        .security-screen .wizard-btn {
          height: 42px;
          padding: 0 18px;
          font-size: 14px;
          letter-spacing: 0.01em;
          box-shadow: 0 10px 20px rgba(240, 50, 85, 0.23);
        }

        .security-screen .sessions {
          padding: 22px 22px 12px;
        }

        .security-screen .sessions-head {
          margin-bottom: 6px;
        }

        .security-screen .logout-link {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .security-screen .session-item {
          margin-top: 10px;
          border: 0;
          border-radius: 16px;
          background: #f4f7fb;
          padding: 12px;
          transition: background 0.2s ease;
        }

        .security-screen .session-item:hover {
          background: #eef3fa;
        }

        .security-screen .device {
          width: 44px;
          height: 44px;
          background: #fff;
          box-shadow: inset 0 0 0 1px #dfe6f0;
        }

        .security-screen .session-name {
          font-size: 18px;
        }

        .security-screen .badge {
          background: #dff9e8;
          color: #2f9f5d;
        }

        .security-screen .session-meta {
          font-size: 13px;
          color: #6f839f;
        }

        .security-screen .open-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #fff;
          color: #6c7f9a;
          box-shadow: inset 0 0 0 1px #d9e2ee;
        }

        .security-screen .side-panel {
          padding: 22px;
        }

        .security-screen .side-panel p {
          margin-top: 8px;
          font-size: 14px;
          color: #68809d;
        }

        .security-screen .vault-scale {
          margin-top: 18px;
          border: 1px solid #e7ecf4;
          border-radius: 16px;
          background: #f8faff;
          padding: 14px 14px 10px;
        }

        .security-screen .scale-line {
          height: 7px;
          background: #dfe6f0;
        }

        .security-screen .scale-tabs button {
          font-size: 10px;
          color: #8b9cb3;
        }

        .security-screen .scale-tabs button.active {
          color: #ef2f5a;
        }

        .security-screen .info-box {
          border: 1px solid #e2e9f3;
          border-radius: 16px;
          background: #f6f9ff;
          color: #6f84a0;
          margin-top: 14px;
        }

        .security-screen .data-card {
          border-color: #f3d8de;
          background: linear-gradient(180deg, #fff9fa, #fff6f8);
        }

        .security-screen .export-btn {
          height: 44px;
          border: 1px solid #f0b9c5;
          color: #eb2f58;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .security-screen .export-btn:hover {
          background: #ef2f5a;
          color: #fff;
        }

        .help-screen {
          padding: 6px 6px 14px;
          border-radius: 24px;
          background: radial-gradient(circle at 90% 0, #fff2f6 0, transparent 36%), transparent;
        }

        .help-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 20px;
        }

        .help-title {
          margin: 0;
          font-size: clamp(34px, 3.2vw, 50px);
          line-height: 1.04;
          letter-spacing: -0.03em;
          color: #121f3a;
        }

        .help-subtitle {
          margin: 8px 0 0;
          color: #647a97;
          font-size: 16px;
          font-weight: 600;
          max-width: 740px;
        }

        .help-save-btn {
          border: 0;
          height: 50px;
          border-radius: 999px;
          padding: 0 30px;
          background: linear-gradient(180deg, #f23857, #ea2449);
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 10px 22px rgba(240, 50, 85, 0.24);
          cursor: pointer;
          line-height: 1;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .help-save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 26px rgba(240, 50, 85, 0.28);
        }

        .help-card {
          border: 1px solid #e3e9f2;
          border-radius: 22px;
          background: linear-gradient(180deg, #ffffff, #fcfdff);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          box-shadow: 0 8px 18px rgba(24, 43, 74, 0.06);
        }

        .help-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .help-icon {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          background: linear-gradient(180deg, #fff2f6, #ffecef);
          color: var(--accent);
          display: grid;
          place-items: center;
          font-size: 24px;
          flex: 0 0 auto;
          box-shadow: inset 0 0 0 1px #ffd7df;
        }

        .help-name {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #17243f;
          line-height: 1.1;
        }

        .help-copy {
          margin: 6px 0 0;
          color: #6f839f;
          font-size: 15px;
          font-weight: 600;
        }

        .help-grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 342px;
          gap: 20px;
          align-items: start;
        }

        .help-section-title {
          margin: 12px 0;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 34px;
          color: #17243f;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .help-section-title span {
          color: var(--accent);
          font-size: 24px;
        }

        .sound-list {
          display: grid;
          gap: 10px;
        }

        .sound-row {
          border: 1px solid #e5ebf4;
          background: linear-gradient(180deg, #ffffff, #fbfcff);
          border-radius: 22px;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 18px rgba(24, 43, 74, 0.05);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .sound-row:hover {
          border-color: #d8e1ee;
          transform: translateY(-1px);
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
          border-radius: 12px;
          background: #fff1f4;
          color: var(--accent);
          display: grid;
          place-items: center;
          font-size: 17px;
          flex: 0 0 auto;
        }

        .sound-title {
          margin: 0;
          font-size: 16px;
          color: #192742;
          font-weight: 800;
        }

        .sound-sub {
          margin: 3px 0 0;
          color: #8192aa;
          font-size: 13px;
          font-weight: 600;
        }

        .sound-select {
          border: 1px solid #dde5f1;
          border-radius: 999px;
          background: #f5f8fc;
          color: #31445f;
          font-size: 13px;
          font-weight: 700;
          height: 36px;
          padding: 0 12px;
          font-family: inherit;
          cursor: pointer;
          outline: none;
        }

        .dnd-card {
          border: 1px solid #e3e9f3;
          border-radius: 24px;
          background: linear-gradient(180deg, #ffffff, #fbfcff);
          padding: 18px;
          box-shadow: 0 12px 24px rgba(20, 38, 68, 0.08);
        }

        .dnd-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .dnd-title {
          margin: 0;
          font-size: 30px;
          color: #17243f;
          font-weight: 800;
          letter-spacing: -0.02em;
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
          color: #7d90aa;
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
          height: 44px;
          border-radius: 999px;
          border: 1px solid #dbe4f0;
          background: #eef3f8;
          color: #212f49;
          font-size: 15px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .repeat-row {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #3a4f6c;
          font-size: 15px;
          font-weight: 700;
        }

        .repeat-mark {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid #d5dfec;
          display: grid;
          place-items: center;
          color: transparent;
          background: #fff;
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .repeat-mark.on {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }

        .dnd-note {
          margin-top: 16px;
          border-radius: 16px;
          background: #fff3f5;
          border: 1px solid #ffd9e0;
          padding: 12px 13px;
          color: #e44863;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 600;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .email-wrap {
          margin-top: 22px;
        }

        .email-card {
          margin-top: 10px;
          border: 1px solid #e2e8f1;
          border-radius: 24px;
          background: #fff;
          overflow: hidden;
          box-shadow: 0 10px 22px rgba(24, 43, 74, 0.06);
        }

        .email-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 16px 18px;
          border-top: 1px solid #edf2f8;
          transition: background 0.2s ease;
        }

        .email-row:hover {
          background: #fafcff;
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
          color: #7588a2;
          font-size: 13px;
          font-weight: 600;
        }

        .email-toggle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #c9d4e3;
          background: #fff;
          color: transparent;
          display: grid;
          place-items: center;
          font-size: 16px;
          cursor: pointer;
          flex: 0 0 auto;
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .email-toggle.on {
          border-color: var(--accent);
          background: var(--accent);
          color: #fff;
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
          border-top: 1px solid #dfe7f0;
          padding: 18px 32px 28px;
          color: #9aabc1;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }

        .footer-links {
          display: flex;
          gap: 22px;
        }

        .footer-links button {
          border: 0;
          background: transparent;
          color: #9aabc1;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
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
            margin-top: 0;
          }

          .main-nav button {
            padding: 4px 0 10px;
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
          .help-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .help-name {
            font-size: 17px;
          }

          .help-copy {
            font-size: 14px;
          }

          .help-save-btn {
            width: 100%;
            font-size: 14px;
          }

          .help-card,
          .sound-row {
            border-radius: 20px;
          }

          .dnd-card {
            border-radius: 24px;
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
          .top-actions .unlink-pill {
            display: none;
          }

          .footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">{'\u2764'}</span>
          <span className="brand-text">Eternal Rings</span>
        </div>

        <nav className="main-nav" aria-label="Main">
          <button type="button">Couple Shop</button>
          <button type="button">Ring Scan</button>
          <button type="button">My Ring</button>
          <button type="button" onClick={onNavigateCoupleProfile}>Couple Profile</button>
          <button type="button" onClick={onNavigateRelationship}>Relationship</button>
          <button type="button" className="active">Settings</button>
        </nav>

        <div className="top-actions">
          <span className="unlink-pill">{'\u2923'} UNLINKED</span>
          <span className="top-icon">{'\u263E'}</span>
          <span className="top-icon">{'\u{1F514}'}</span>
          <img
            className="avatar"
            src={navAvatar}
            alt="Profile"
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
            <h4>Premium Plan</h4>
            <p>Renewing on Dec 12, 2024</p>
            <button type="button">Manage Subscription</button>
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
                  <button type="button" className="ghost-btn">Reset</button>
                  <button type="button" className="save-btn">Save Changes</button>
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
                  <article className="general-card">
                    <h3><span className="general-icon">{'\u{1F310}'}</span>Language</h3>
                    <input
                      className="search-input"
                      type="text"
                      value="Search languages..."
                      readOnly
                      aria-label="Search languages"
                    />
                    <div className="language-list">
                      {['English (US)', 'French (FR)', 'Spanish (ES)'].map((item) => (
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
                    </div>
                  </article>

                  <article className="general-card">
                    <h3><span className="general-icon">{'\u21C5'}</span>Data Management</h3>
                    <div className="data-box">
                      <div className="data-top">
                        <div>
                          <h4>Auto-Sync Cloud Backup</h4>
                          <p>Automatically backup your memories and ring data to the cloud. You can restore these anytime.</p>
                        </div>
                        <button
                          type="button"
                          className={`toggle ${autoSync ? 'on' : ''}`}
                          onClick={() => setAutoSync((value) => !value)}
                          aria-label="Toggle auto-sync cloud backup"
                        />
                      </div>
                      <div className="sync-meta">{'\u21BB'} Last synced 2 minutes ago</div>
                    </div>
                    <button type="button" className="download-btn">{'\u2601'} Download All Data (.json)</button>
                  </article>
                </section>

                <article className="danger-card">
                  <div>
                    <h3 className="danger-title">Account Deactivation</h3>
                    <p className="danger-sub">Permanently delete your account and all associated shared memories. This action is irreversible.</p>
                  </div>
                  <button type="button" className="danger-btn">Delete Account</button>
                </article>
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
                        </div>
                      </div>
                      <div className="action-row">
                        <button
                          type="button"
                          className={`toggle ${twoFactorEnabled ? 'on' : ''}`}
                          onClick={() => setTwoFactorEnabled((value) => !value)}
                          aria-label="Toggle two-factor authentication"
                        />
                        <button className="wizard-btn" type="button">Setup Wizard</button>
                      </div>
                    </article>

                    <article className="card sessions">
                      <div className="sessions-head">
                        <h3>{'\u{1F5A5}'} Active Sessions</h3>
                        <button type="button" className="logout-link">Log out all devices</button>
                      </div>

                      {sessions.map((session) => (
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
                          <button className="open-btn" type="button" aria-label={`View ${session.name}`}>{'\u21AA'}</button>
                        </div>
                      ))}
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
                      <button type="button" className="export-btn">Export Data Archive {'\u21E9'}</button>
                      <div className="last-export">Last export: never</div>
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
                  <button type="button" className="help-save-btn">Save Changes</button>
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
                          <div className="sound-dot">{'\u25B7'}</div>
                          <div>
                            <h4 className="sound-title">The Ringing (Anniversary)</h4>
                            <p className="sound-sub">Elegant chime for your most important dates</p>
                          </div>
                        </div>
                        <select className="sound-select" defaultValue="Bell Chime">
                          <option>Bell Chime</option>
                          <option>Crystal Bell</option>
                          <option>Warm Piano</option>
                        </select>
                      </article>

                      <article className="sound-row">
                        <div className="sound-row-main">
                          <div className="sound-dot">{'\u25B7'}</div>
                          <div>
                            <h4 className="sound-title">The Whisper (Reminders)</h4>
                            <p className="sound-sub">A soft nudge for daily relationship goals</p>
                          </div>
                        </div>
                        <select className="sound-select" defaultValue="Soft Hum">
                          <option>Soft Hum</option>
                          <option>Wind Bell</option>
                          <option>Gentle Pop</option>
                        </select>
                      </article>

                      <article className="sound-row">
                        <div className="sound-row-main">
                          <div className="sound-dot">{'\u25B7'}</div>
                          <div>
                            <h4 className="sound-title">The Spark (Messages)</h4>
                            <p className="sound-sub">Instant notification for new shared messages</p>
                          </div>
                        </div>
                        <select className="sound-select" defaultValue="Digital Pop">
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
                        <div className="dnd-time">10:00PM</div>
                        <div className="dnd-time">07:00AM</div>
                      </div>

                      <div className="repeat-row">
                        <button
                          type="button"
                          className={`repeat-mark ${repeatDaily ? 'on' : ''}`}
                          onClick={() => setRepeatDaily((value) => !value)}
                          aria-label="Toggle repeat every day"
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

