import React from 'react';

const PROFILE_STORAGE_KEY = 'eternal_rings_profile_data';
const PROFILE_AVATAR_STORAGE_KEY = 'eternal_rings_profile_avatar';

const ProfileView = ({
  onNavigateRelationship = () => {},
  onNavigateSettings = () => {},
  onNavigateCoupleProfile = () => {}
}) => {
  const initialProfile = React.useMemo(() => ({
    title: 'Alex & Sam',
    togetherSince: 'Together since Oct 12, 2021',
    handle: 'alex_and_sam',
    phone: '+1 555-0123'
  }), []);

  const [avatarUrl, setAvatarUrl] = React.useState(() => {
    try {
      return localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [profile, setProfile] = React.useState(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!saved) return initialProfile;
      return { ...initialProfile, ...JSON.parse(saved) };
    } catch {
      return initialProfile;
    }
  });
  const [draftProfile, setDraftProfile] = React.useState(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!saved) return initialProfile;
      return { ...initialProfile, ...JSON.parse(saved) };
    } catch {
      return initialProfile;
    }
  });
  const fileInputRef = React.useRef(null);

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
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const headerAvatar =
    avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80';

  const handleStartEdit = () => {
    setDraftProfile(profile);
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    setProfile(draftProfile);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(draftProfile));
      if (avatarUrl) {
        localStorage.setItem(PROFILE_AVATAR_STORAGE_KEY, avatarUrl);
      }
    } catch {
      // Ignore localStorage quota or browser privacy mode errors.
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  const handleQuickPhoneChange = () => {
    const next = window.prompt('Enter new phone number', profile.phone);
    if (next === null) return;
    const value = next.trim();
    if (!value) return;
    const nextProfile = { ...profile, phone: value };
    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    } catch {
      // Ignore storage errors.
    }
  };

  return (
    <div className="profile-page">
      <style>{`
        .profile-page {
          min-height: 100vh;
          background: #f4f5f7;
          color: #13213c;
          font-family: Manrope, 'Segoe UI', sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        .topbar {
          height: 72px;
          border-bottom: 1px solid #dde3ec;
          background: #f4f5f7;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          gap: 18px;
          position: sticky;
          top: 0;
          z-index: 20;
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
          justify-content: center;
          gap: 26px;
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

        .mini-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #d4dbe6;
          object-fit: cover;
        }

        .wrap {
          max-width: 930px;
          margin: 0 auto;
          padding: 86px 16px 54px;
        }

        .hero {
          text-align: center;
          margin-bottom: 64px;
        }

        .hero-avatar-wrap {
          position: relative;
          width: 154px;
          height: 154px;
          margin: 0 auto;
        }

        .hero-avatar {
          width: 154px;
          height: 154px;
          border-radius: 50%;
          background: #bdc6d2;
          border: 4px solid #edf1f6;
          box-shadow: 0 14px 28px rgba(18, 33, 59, 0.1);
          object-fit: cover;
          display: block;
        }

        .avatar-camera {
          position: absolute;
          right: 0;
          bottom: 4px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 0;
          background: #ef2f5a;
          color: #fff;
          font-size: 20px;
          display: grid;
          place-items: center;
          box-shadow: 0 8px 18px rgba(239, 47, 90, 0.3);
          cursor: pointer;
        }

        .hero h1 {
          margin: 26px 0 8px;
          font-size: clamp(34px, 4vw, 48px);
          letter-spacing: -0.03em;
          line-height: 1.06;
          color: #15233e;
        }

        .hero p {
          margin: 0;
          color: #ef2f5a;
          font-size: clamp(22px, 2.5vw, 34px);
          font-weight: 600;
        }

        .edit-actions {
          margin-top: 18px;
          display: inline-flex;
          gap: 10px;
        }

        .edit-btn,
        .save-btn,
        .cancel-btn {
          border: 0;
          border-radius: 999px;
          height: 38px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .edit-btn,
        .save-btn {
          background: linear-gradient(180deg, #f23857, #ea2449);
          color: #fff;
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
          font-size: 22px;
          font-weight: 700;
          text-align: center;
          padding: 0 12px;
          margin: 6px auto;
          display: block;
          font-family: inherit;
        }

        .profile-input.sub {
          color: #ef2f5a;
          font-size: 18px;
          height: 44px;
        }

        .days-card {
          border: 1px solid #f2d6dc;
          border-radius: 38px;
          background: #fff;
          padding: 22px 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
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
          background: #fff1f4;
          color: #ef2f5a;
          display: grid;
          place-items: center;
          font-size: 26px;
          flex: 0 0 auto;
        }

        .days-label {
          margin: 0;
          color: #627896;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .days-value {
          margin: 3px 0 0;
          color: #ef2f5a;
          font-size: clamp(42px, 5vw, 64px);
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
          font-size: 16px;
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
          margin-top: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 18px;
        }

        .card {
          border: 1px solid #e5ebf3;
          border-radius: 30px;
          background: #fff;
          padding: 22px;
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
          font-size: 36px;
          letter-spacing: -0.02em;
          color: #16243e;
        }

        .card p {
          margin: 8px 0 18px;
          color: #6e819c;
          font-size: 15px;
          line-height: 1.4;
          font-weight: 600;
        }

        .handle-box {
          min-height: 52px;
          border: 1px solid #d4ddec;
          border-radius: 999px;
          background: #f4f7fb;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          color: #8093a9;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
        }

        .handle-box strong {
          color: #15233e;
          font-size: 30px;
          letter-spacing: -0.02em;
        }

        .handle-input {
          border: 0;
          background: transparent;
          color: #15233e;
          font-size: 30px;
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
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .phone-input {
          border: 1px solid #d8e0ec;
          border-radius: 10px;
          background: #fff;
          color: #16243e;
          font-size: 28px;
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
          background: #ffecef;
          color: #ef2f5a;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .signout {
          margin-top: 20px;
          border: 1px solid #f3d3d9;
          border-radius: 999px;
          background: #fff;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
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
          font-size: 22px;
        }

        .signout h4 {
          margin: 0;
          font-size: 34px;
          letter-spacing: -0.02em;
          color: #111f39;
        }

        .signout p {
          margin: 3px 0 0;
          color: #6e819d;
          font-size: 15px;
          font-weight: 600;
        }

        .signout-arrow {
          color: #c8d2de;
          font-size: 34px;
          line-height: 1;
        }

        .footer {
          margin-top: 120px;
          text-align: center;
          color: #9aaac0;
          font-size: 13px;
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
          font-size: 13px;
          cursor: pointer;
        }

        .hidden-input {
          display: none;
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
            margin-top: 0;
          }

          .main-nav button {
            padding: 4px 0 10px;
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
          .top-actions .top-icon,
          .top-actions .unlink-pill {
            display: none;
          }

          .wrap {
            padding-top: 36px;
          }

          .hero {
            margin-bottom: 36px;
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
            font-size: 28px;
          }

          .phone-value {
            font-size: 28px;
          }

          .phone-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .handle-box strong {
            font-size: 21px;
          }

          .handle-input {
            font-size: 21px;
          }

          .footer {
            margin-top: 72px;
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
          <button type="button" onClick={onNavigateSettings}>Settings</button>
        </nav>

        <div className="top-actions">
          <span className="unlink-pill">{'\u2923'} UNLINKED</span>
          <span className="top-icon">{'\u263E'}</span>
          <span className="top-icon">{'\u{1F514}'}</span>
          <img className="mini-avatar" src={headerAvatar} alt="Profile" />
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <div className="hero-avatar-wrap">
            {avatarUrl ? (
              <img className="hero-avatar" src={avatarUrl} alt="Selected profile" />
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
          <div className="edit-actions">
            {isEditing ? (
              <>
                <button type="button" className="save-btn" onClick={handleSaveProfile}>Save Profile</button>
                <button type="button" className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
              </>
            ) : (
              <button type="button" className="edit-btn" onClick={handleStartEdit}>Edit Profile</button>
            )}
          </div>
        </section>

        <section className="days-card">
          <div className="days-left">
            <div className="days-icon">{'\u2728'}</div>
            <div>
              <p className="days-label">Days Together</p>
              <p className="days-value">842 Days</p>
            </div>
          </div>
          <div className="days-right">
            <div className="days-avatars">{'\u{1F468}\u{1F469}'}</div>
            <div className="days-link"><span className="days-dot" />Linked to Sam Peterson</div>
          </div>
        </section>

        <section className="grid">
          <article className="card">
            <div className="card-head">
              <div className="card-icon link">{'\u{1F517}'}</div>
            </div>
            <h3>Nickname & Link</h3>
            <p>Set your custom profile handle for sharing your timeline.</p>
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
            <h3>Phone Settings</h3>
            <p>Secured with two-factor authentication.</p>
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
              <button type="button" className="change-btn" onClick={handleQuickPhoneChange}>Change Number</button>
            </div>
          </article>
        </section>

        <section className="signout">
          <div className="signout-left">
            <div className="signout-icon">{'\u21AA'}</div>
            <div>
              <h4>Sign Out</h4>
              <p>Disconnect from this device securely.</p>
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
          <p>{'\u00A9'} 2025 Eternal Rings. Made for couples everywhere.</p>
        </footer>
      </main>
    </div>
  );
};

export default ProfileView;
