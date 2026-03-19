import React from 'react';

type Props = {
  onNavigateRelationship?: () => void;
  onNavigateCoupleProfile?: () => void;
  onNavigateProfile?: () => void;
};

const SettingsView: React.FC<Props> = ({
  onNavigateRelationship = () => {},
  onNavigateCoupleProfile = () => {},
  onNavigateProfile = () => {},
}) => {
  return (
    <div className="settings-page">
      <style>{`
        .settings-page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #111827;
          font-family: Manrope, 'Segoe UI', sans-serif;
        }

        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
          font-feature-settings: 'liga';
        }

        .topbar {
          height: 72px;
          border-bottom: 1px solid #ece7ed;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          gap: 20px;
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
          justify-content: center;
          gap: 22px;
        }

        .main-nav button {
          border: 0;
          background: transparent;
          font-size: 12px;
          color: #27272a;
          font-weight: 400;
          cursor: pointer;
          padding: 6px 0;
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
          gap: 16px;
        }

        .icon-btn {
          border: 0;
          background: transparent;
          cursor: pointer;
          color: #27272a;
          padding: 0;
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .icon-btn .material-symbols-outlined {
          font-size: 23px;
          line-height: 1;
          font-variation-settings: 'wght' 250;
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

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #efedf1;
          object-fit: cover;
          cursor: pointer;
        }

        .content {
          max-width: 1100px;
          margin: 24px auto;
          padding: 0 16px;
        }

        .placeholder-card {
          border: 1px solid #e6e9f0;
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          color: #64748b;
          font-size: 14px;
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
          }

          .main-nav button {
            padding: 4px 0 8px;
            white-space: nowrap;
          }

          .top-actions {
            margin-left: auto;
          }
        }

        @media (max-width: 640px) {
          .top-actions .divider,
          .top-actions .profile-name {
            display: none;
          }
        }
      `}</style>

      <header className="topbar">
        <div className="brand">
          <span className="material-symbols-outlined brand-logo">diamond</span>
          <span className="brand-text">BondKeeper</span>
        </div>

        <nav className="main-nav" aria-label="Main">
          <button type="button">Dashboard</button>
          <button type="button">Couple Shop</button>
          <button type="button">My Ring</button>
          <button type="button" onClick={onNavigateCoupleProfile}>Couple Profile</button>
          <button type="button" onClick={onNavigateRelationship}>Relationship</button>
          <button type="button" className="active">Settings</button>
        </nav>

        <div className="top-actions">
          <button type="button" className="icon-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications_none</span>
          </button>
          <button type="button" className="icon-btn" aria-label="Theme">
            <span className="material-symbols-outlined">bedtime</span>
          </button>
          <button type="button" className="icon-btn" aria-label="Shopping cart">
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>
          <span className="divider" />
          <span className="profile-name">Alex & Jamie</span>
          <img
            className="avatar"
            src="https://i.pravatar.cc/80?img=65"
            alt="Profile"
            onClick={onNavigateProfile}
          />
        </div>
      </header>

      <main className="content">
        <section className="placeholder-card">Settings page content goes here.</section>
      </main>
    </div>
  );
};

export default SettingsView;
