import React from 'react';
import RelationshipCertificateView from './RelationshipCertificateView';

type Props = {
  relationshipId?: number;
};

const RelationshipView: React.FC<Props> = ({ relationshipId }) => {
  const [inviteId, setInviteId] = React.useState('');
  const [showCertificate, setShowCertificate] = React.useState(false);

  if (showCertificate) {
    return (
      <RelationshipCertificateView
        relationshipId={relationshipId}
        onUnpaired={() => setShowCertificate(false)}
      />
    );
  }

  return (
    <div className="invite-page">
      <style>{`
        :root {
          --bg: #f5f6fa;
          --text: #1f2430;
          --muted: #6a7282;
          --muted-2: #8a93a3;
          --brand: #0c5adb;
          --brand-2: #e65b27;
          --card: #ffffff;
          --border: #e7ebf3;
          --pill: #fdf3ee;
          --nav: #0f172a;
        }

        .invite-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'Manrope', 'Segoe UI', sans-serif;
        }

        .shell {
          max-width: 1080px;
          margin: 0 auto;
          padding: 48px 20px 72px;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #ffffff;
          border-bottom: 1px solid #ece7ed;
        }

        .nav-inner {
          max-width: 1800px;
          margin: 0 auto;
          padding: 0 48px;
          min-height: 72px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 20px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .brand-icon {
          color: #f542a7;
          width: 21px;
          height: 21px;
        }

        .brand-text {
          color: #f542a7;
          font-size: 26px;
          font-weight: 600;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .nav-links {
          display: inline-flex;
          gap: 22px;
          justify-self: center;
        }

        .nav-link {
          padding: 6px 0;
          font-weight: 400;
          color: #27272a;
          font-size: 12px;
          text-decoration: none;
          transition: color 180ms ease;
        }

        .nav-link::after {
          content: none;
        }

        .nav-link:hover {
          color: #f542a7;
        }

        .nav-link.active {
          color: #f542a7;
          font-weight: 700;
        }

        .nav-actions {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          color: #27272a;
        }

        .icon-btn {
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #27272a;
          transition: color 180ms ease;
          border: 0;
          background: transparent;
          padding: 0;
          position: relative;
        }

        .icon-btn:hover {
          color: #f542a7;
        }

        .nav-icon {
          width: 23px;
          height: 23px;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
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
          background: url('https://i.pravatar.cc/68?img=65') center/cover no-repeat;
          border: 1px solid #efedf1;
          cursor: pointer;
        }

        .header {
          margin-bottom: 32px;
        }

        .title {
          margin: 0;
          font-size: clamp(32px, 4vw, 38px);
          letter-spacing: -0.02em;
          font-weight: 800;
          color: #121728;
        }

        .subtitle {
          margin: 10px 0 0;
          font-size: 15px;
          color: var(--muted);
          line-height: 1.5;
          max-width: 640px;
        }

        .search-card {
          margin-top: 28px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          display: grid;
          grid-template-columns: 1fr 140px;
          gap: 12px;
          box-shadow: 0 6px 18px rgba(12, 28, 61, 0.06);
        }

        .search-input {
          border: 1px solid var(--border);
          height: 42px;
          border-radius: 9px;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          background: #fafbff;
        }

        .search-input::placeholder {
          color: var(--muted-2);
        }

        .cta {
          border: none;
          background: linear-gradient(90deg, #fa7a42, #f35b1c);
          color: #fff;
          font-weight: 800;
          font-size: 13px;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(243, 91, 28, 0.25);
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        .cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(243, 91, 28, 0.32);
        }

        .section-head {
          margin: 32px 0 12px;
          font-size: 14px;
          letter-spacing: 0.02em;
          color: #252a38;
          font-weight: 800;
        }

        .badge {
          background: var(--pill);
          color: #f0652d;
          font-weight: 800;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #ffd5bf;
          margin-left: 10px;
        }

        .empty-card {
          border: 1px dashed #e4e9f2;
          background: #fff;
          border-radius: 14px;
          min-height: 220px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 28px;
          color: var(--muted);
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #f7f9fd;
          display: grid;
          place-items: center;
          font-size: 24px;
          color: #c1c8d8;
          margin: 0 auto 14px;
        }

        .empty-title {
          margin: 0 0 6px;
          color: #1e2433;
          font-weight: 800;
          font-size: 16px;
        }

        .empty-copy {
          margin: 0 0 18px;
          line-height: 1.45;
          color: var(--muted);
          font-size: 14px;
        }

        .pill-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .pill-btn {
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 14px;
          padding: 10px 14px;
          font-weight: 800;
          font-size: 12px;
          color: #2d3446;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(17, 33, 64, 0.06);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          margin-top: 26px;
        }

        .feature-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr;
          row-gap: 4px;
          box-shadow: 0 8px 18px rgba(13, 27, 57, 0.05);
        }

        .feature-title {
          font-weight: 800;
          font-size: 14px;
          color: #1f2533;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .feature-desc {
          margin: 0;
          font-size: 13px;
          color: var(--muted-2);
          line-height: 1.45;
        }

        .dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #f0652d;
        }

        @media (max-width: 720px) {
          .nav-inner {
            grid-template-columns: 1fr;
            row-gap: 10px;
            padding: 10px 14px;
          }

          .nav-links {
            justify-self: start;
            flex-wrap: wrap;
          }

          .nav-actions {
            justify-self: start;
          }

          .nav-actions .divider,
          .nav-actions .profile-name {
            display: none;
          }

          .search-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <nav className="nav">
        <div className="nav-inner">
          <div className="brand">
            <svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 9L7 4H17L21 9L12 20L3 9Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M7 4L12 20L17 4" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 9H21" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span className="brand-text">BondKeeper</span>
          </div>

          <div className="nav-links" aria-label="Primary navigation">
            <a className="nav-link" href="#home">Dashboard</a>
            <a className="nav-link" href="#shop">Couple Shop</a>
            <a className="nav-link" href="#ring">My Ring</a>
            <a className="nav-link" href="#couple">Couple Profile</a>
            <a className="nav-link active" href="#relationship">Relationship</a>
            <a className="nav-link" href="#setting">Settings</a>
          </div>

          <div className="nav-actions">
            <button className="icon-btn" type="button" aria-label="Notifications">
              <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 17H9" />
                <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              </svg>
            </button>
            <button className="icon-btn" type="button" aria-label="Theme">
              <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            </button>
            <button className="icon-btn" type="button" aria-label="Shopping cart">
              <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M2 3h3l2.4 11.2a1 1 0 001 .8h9.7a1 1 0 001-.8L21 7H6" />
              </svg>
            </button>
            <span className="divider" />
            <span className="profile-name">Alex & Jamie</span>
            <div className="avatar" aria-label="Profile" />
          </div>
        </div>
      </nav>

      <div className="shell" id="home">
        <header className="header">
          <h1 className="title">Start Your Journey Together</h1>
          <p className="subtitle">
            Connect with your partner to create your digital relationship certificate and celebrate
            your love. Once linked, you can document milestones and share memories.
          </p>
        </header>

        <div className="search-card" id="invites">
          <input
            className="search-input"
            placeholder="Search by Partner ID (e.g., @john123)"
            value={inviteId}
            onChange={(e) => setInviteId(e.target.value)}
          />
          <button className="cta" type="button" onClick={() => setShowCertificate(true)}>
            Send Invitation
          </button>
        </div>

        <div className="section-head">
          Pending Invitations <span className="badge">0 Requests</span>
        </div>

        <div className="empty-card" id="support">
          <div>
            <div className="empty-icon">✉️</div>
            <p className="empty-title">No pending invites yet</p>
            <p className="empty-copy">
              When you receive or send a partner request, it will appear here. Share your ID with
              your partner to get started.
            </p>
            <div className="pill-actions">
              <button className="pill-btn" type="button">
                How it works
              </button>
              <button className="pill-btn" type="button">
                Copy My ID
              </button>
            </div>
          </div>
        </div>

        <div className="feature-grid" id="milestones">
          <div className="feature-card">
            <div className="feature-title">
              <span className="dot" />
              Privacy First
            </div>
            <p className="feature-desc">
              Only you and your partner can see your shared certificate and timeline data.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-title">
              <span className="dot" />
              Digital Milestone
            </div>
            <p className="feature-desc">
              Generate a unique digital keepsake that updates as your relationship grows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipView;

