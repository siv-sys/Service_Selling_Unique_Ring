   import React from 'react';

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
  const [linkedRings, setLinkedRings] = React.useState([]);

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

  return (
    <div className="relationship-page">
      <style>{`
        .relationship-page {
          min-height: 100vh;
          background: #f3f5f8;
          color: #101b38;
          font-family: Manrope, 'Segoe UI', sans-serif;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        .relationship-topbar {
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

        .heart-logo {
          color: #ef2f5a;
          font-size: 26px;
          line-height: 1;
        }

        .brand-title {
          color: #0f1934;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.035em;
        }

        .top-links {
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 26px;
          flex: 1;
          justify-content: center;
         
        }

        .top-link {
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

        .top-link.active {
          color: #ef2f5a;
        }

        .top-link.active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 2px;
          height: 2px;
          background: #ef2f5a;
          border-radius: 999px;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 206px;
          justify-content: flex-end;
        }

        .status-pill {
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

        .action-icon {
          color: #61718d;
          font-size: 20px;
        }

        .mini-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #d4dbe6;
          cursor: pointer;
        }

        .relationship-wrap {
          max-width: 1140px;
          margin: 0 auto;
          padding: 72px 20px 56px;
        }
        

        .hero {
          text-align: center;
          margin-bottom: 54px;
        }

        .label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 15px;
          border-radius: 999px;
          border: 1px solid #f3cfd8;
          background: #fff0f4;
          color: #ef2f5a;
          text-transform: uppercase;
          letter-spacing: 0.24em;
          font-size: 11px;
          font-weight: 900;
        }

        .hero h1 {
          margin: 18px 0 10px;
          font-size: clamp(36px, 5.1vw, 56px);
          letter-spacing: -0.04em;
          font-weight: 700;
          color: #0f1935;
          line-height: 1.06;
        }

        .hero p {
          margin: 0;
          color: #6d7e9a;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.5;
        }

        .pair-code {
          margin-top: 18px;
          display: inline-block;
          border: 1px solid #d7deea;
          border-radius: 8px;
          background: #f5f8fc;
          color: #8d9cb4;
          padding: 7px 14px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .certificate {
          background: #f9fbfd;
          border-radius: 28px;
          border: 1px solid #e4eaf2;
          box-shadow: 0 14px 34px rgba(37, 63, 105, 0.08);
          padding: 44px;
        }

        .identity {
          display: grid;
          grid-template-columns: 1fr 170px 1fr;
          gap: 34px;
          align-items: start;
          justify-items: center;
          margin-bottom: 52px;
        }

        .user {
          text-align: center;
        }

        .avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 3px solid #f7f9fc;
          box-shadow: 0 0 0 1px #d6deeb;
          object-fit: cover;
          margin-bottom: 14px;
        }

        .user h3 {
          margin: 0;
          font-size: 34px;
          font-weight: 900;
          color: #131e3a;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }

        .user span {
          color: #8e9bb3;
          font-size: 15px;
          font-weight: 600;
          display: block;
          margin-top: 4px;
        }

        .center-info {
          text-align: center;
          padding-top: 4px;
        }

        .center-heart {
          width: 64px;
          height: 64px;
          border: 1px solid #d9dfeb;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #ef2f5a;
          margin: 0 auto 12px;
          font-size: 30px;
        }

        .center-info .kicker {
          margin: 0;
          color: #9aabc1;
          letter-spacing: 0.17em;
          text-transform: uppercase;
          font-weight: 900;
          font-size: 14px;
        }

        .center-info .date {
          margin: 7px 0 0;
          color: #17223e;
          font-size: 30px;
          font-weight: 900;
          line-height: 1.2;
        }

        .center-info .days {
          margin: 0;
          color: #9ba8bc;
          font-size: 16px;
        }

        .grid-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 26px;
          margin-bottom: 42px;
        }

        .card {
          border: 1px solid #e3e8f0;
          border-radius: 24px;
          background: #f3f6fa;
          min-height: 360px;
          padding: 32px;
        }

        .card h4 {
          margin: 0;
          font-size: 30px;
          font-weight: 900;
          color: #141f39;
          margin-bottom: 8px;
        }

        .meta {
          margin-top: 18px;
          display: grid;
          gap: 12px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #71829c;
          font-size: 14px;
          gap: 14px;
        }

        .row span {
          min-width: 74px;
          font-weight: 700;
        }

        .field-input,
        .field-select {
          flex: 1;
          height: 38px;
          border-radius: 9px;
          border: 1px solid #cfdae8;
          background: #fbfdff;
          color: #1f2c47;
          padding: 0 10px;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
        }

        .field-input:focus,
        .field-select:focus {
          outline: none;
          border-color: #ef2f5a;
          box-shadow: 0 0 0 3px rgba(239, 47, 90, 0.14);
        }

        .outline-btn,
        .solid-btn {
          margin-top: 22px;
          border-radius: 10px;
          font-weight: 900;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 14px;
          font-family: inherit;
        }

        .outline-btn {
          border: 1.5px solid #ef2f5a;
          color: #ef2f5a;
          background: transparent;
          width: 180px;
        }

        .helper {
          margin: 6px 0 0;
          color: #a0aec2;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          font-size: 13px;
        }

        .options {
          margin-top: 18px;
          display: grid;
          gap: 11px;
        }

        .option {
          position: relative;
          height: 44px;
          border-radius: 10px;
          border: 1px solid #cfd9e7;
          background: #f8fbff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px 0 14px;
          color: #4d5e7a;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
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
          border: 1.5px solid #8f9eb5;
          display: grid;
          place-items: center;
        }

        .option.active {
          border-color: #ef2f5a;
          color: #1b2642;
        }

        .option.active .dot {
          border-color: #ef2f5a;
          background: #ef2f5a;
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
          height: 40px;
          border-radius: 10px;
          border: 1px solid #cfd9e7;
          background: #f8fbff;
          padding: 0 12px;
          font-size: 14px;
          color: #1d2a45;
          font-family: inherit;
        }

        .ring-input:focus {
          outline: none;
          border-color: #ef2f5a;
          box-shadow: 0 0 0 3px rgba(239, 47, 90, 0.14);
        }

        .ring-add-btn {
          border: 1px solid #ef2f5a;
          background: #fff2f6;
          color: #ef2f5a;
          height: 40px;
          border-radius: 10px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
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
          border: 1px solid #d5deeb;
          border-radius: 999px;
          background: #f3f7fc;
          padding: 6px 10px;
          font-size: 12px;
          color: #31435f;
          font-weight: 700;
        }

        .ring-remove {
          border: 0;
          background: transparent;
          color: #ef2f5a;
          cursor: pointer;
          font-size: 12px;
          font-weight: 900;
          padding: 0;
        }

        .solid-btn {
          border: 1px solid transparent;
          background: linear-gradient(180deg, #ef2f5a, #dd1d49);
          color: #fff;
          width: 160px;
          box-shadow: 0 9px 20px rgba(239, 47, 90, 0.28);
        }

        .divider {
          height: 1px;
          background: #e0e7f0;
          margin-bottom: 32px;
        }

        .linked h5 {
          margin: 0 0 14px;
          font-size: 30px;
          color: #141e38;
          font-weight: 900;
        }

        .linked-box {
          min-height: 92px;
          border-radius: 22px;
          border: 1px dashed #d2dce9;
          color: #a0aec4;
          display: grid;
          place-items: center;
          font-size: 15px;
          font-weight: 600;
        }

        .footer {
          margin-top: 48px;
          text-align: center;
          color: #c7d3e2;
          text-transform: uppercase;
          letter-spacing: 0.45em;
          font-size: 11px;
          font-weight: 800;
        }

        @media (max-width: 1024px) {
          .relationship-topbar {
            height: auto;
            min-height: 68px;
            padding: 10px 14px;
            flex-wrap: wrap;
            gap: 10px;
          }

          .brand-title {
            transform: none;
            width: auto;
            margin-right: 0;
            font-size: 26px;
          }

          .top-links {
            order: 3;
            justify-content: flex-start;
            width: 100%;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .top-link {
            padding: 4px 0 10px;
          }

          .top-link.active::after {
            bottom: 0;
          }

          .top-actions {
            min-width: auto;
            margin-left: auto;
          }

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
            font-size: 30px;
            margin-bottom: 8px;
          }

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
          .status-pill,
          .action-icon {
            display: none;
          }

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

      <header className="relationship-topbar">
        <div className="brand">
          <span className="heart-logo">{'\u2764'}</span>
          <span className="brand-title">Eternal Rings</span>
        </div>

        <div className="top-links" aria-label="Primary navigation">
          <button className="top-link">Couple Shop</button>
          <button className="top-link">Ring Scan</button>
          <button className="top-link">My Ring</button>
          <button className="top-link" type="button" onClick={onNavigateCoupleProfile}>Couple Profile</button>
          <button className="top-link active">Relationship</button>
          <button className="top-link" type="button" onClick={onNavigateSettings}>Settings</button>
        </div>

        <div className="top-actions">
          <span className="status-pill">{'\u2923'} UNLINKED</span>
          <span className="action-icon">{'\u263E'}</span>
          <span className="action-icon">{'\u{1F514}'}</span>
          <img
            className="mini-avatar"
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"
            alt="Member"
            onClick={onNavigateProfile}
          />
        </div>
      </header>

      <main className="relationship-wrap">
        <section className="hero">
          <span className="label">{'\u2726'} Always & Forever</span>
          <h1>Relationship Certificate</h1>
          <p>Live relationship profile from your database.</p>
          <span className="pair-code">PAIR001</span>
        </section>

        <section className="certificate">
          <div className="identity">
            <article className="user">
              <img
                className="avatar"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"
                alt="John Carter"
              />
             <h2>Sav Siv</h2>
              <span>@siv123</span>
            </article>

            <article className="center-info">
              <div className="center-heart">{'\u2764'}</div>
              <p className="kicker">Established</p>
              <p className="date">1/1/2025</p>
              <p className="days">1y 53d together</p>
            </article>

            <article className="user">
              <img
                className="avatar"
                src="https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&w=240&q=80"
                alt="Anna Lee"
              />
             <h2>Thalita</h2>
              <span>@anna456</span>
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
