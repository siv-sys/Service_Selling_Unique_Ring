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
          z-index: 10;
          backdrop-filter: blur(12px);
          background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245,248,255,0.92));
          border-bottom: 1px solid rgba(228, 233, 244, 0.9);
          box-shadow: 0 10px 24px rgba(20, 33, 61, 0.08);
        }

        .nav-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 12px 22px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 18px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #0b1428;
          font-weight: 900;
          letter-spacing: -0.02em;
          font-size: 17px;
        }

        .brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: radial-gradient(circle at 30% 35%, #ff7b8c, #f02752);
          display: grid;
          place-items: center;
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          box-shadow: 0 8px 16px rgba(240, 39, 82, 0.24);
        }

        .nav-links {
          display: inline-flex;
          gap: 20px;
          justify-self: center;
        }

        .nav-link {
          position: relative;
          padding: 11px 14px;
          border-radius: 999px;
          font-weight: 700;
          color: #4b5563;
          font-size: 13px;
          text-decoration: none;
          transition: color 140ms ease, background 160ms ease, box-shadow 160ms ease;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 6px;
          height: 2px;
          border-radius: 999px;
          background: #ea1b54;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 180ms ease;
        }

        .nav-link:hover {
          color: #0f172a;
          background: rgba(234, 27, 84, 0.06);
        }

        .nav-link:hover::after {
          transform: scaleX(1);
        }

        .nav-link.active {
          color: #e11d48;
          background: rgba(234, 27, 84, 0.14);
          box-shadow: 0 10px 20px rgba(234, 27, 84, 0.12);
        }

        .nav-link.active::after {
          transform: scaleX(1);
          height: 3px;
          bottom: 5px;
        }

        .nav-actions {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #4b5563;
        }

        .status-pill {
          padding: 9px 12px;
          border-radius: 999px;
          border: 1.5px solid #f7c6d2;
          background: rgba(255, 244, 247, 0.9);
          color: #d81b52;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.06em;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 6px 14px rgba(216, 27, 82, 0.12);
          cursor: pointer;
        }

        .icon-btn {
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #4b5563;
          transition: color 120ms ease, transform 120ms ease;
        }

        .icon-btn:hover {
          color: #0f172a;
          transform: translateY(-1px);
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: url('https://i.pravatar.cc/68?img=65') center/cover no-repeat;
          border: 2px solid #f3f4f6;
          box-shadow: 0 4px 10px rgba(17, 24, 39, 0.08);
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
          }

          .nav-links {
            justify-self: start;
            flex-wrap: wrap;
          }

          .nav-actions {
            justify-self: start;
          }

          .search-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <nav className="nav">
        <div className="nav-inner">
          <div className="brand">
            <span className="brand-mark">♥</span>
            Eternal Rings
          </div>

          <div className="nav-links" aria-label="Primary navigation">
            <a className="nav-link" href="#home">Dashboard</a>
            <a className="nav-link" href="#scan">Ring Scan</a>
            <a className="nav-link" href="#ring">My Ring</a>
            <a className="nav-link" href="#couple">Couple Profile</a>
            <a className="nav-link active" href="#relationship">Relationship</a>
            <a className="nav-link" href="#setting">Setting</a>
          </div>

          <div className="nav-actions">
            <button className="status-pill" type="button" aria-label="Relationship status">
              ↻ UNPAIRED
            </button>
            <span className="icon-btn" role="img" aria-label="theme">🌙</span>
            <span className="icon-btn" role="img" aria-label="notifications">🔔</span>
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
