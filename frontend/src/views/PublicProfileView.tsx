import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, resolveApiAssetUrl } from '../lib/api';

type PublicProfileData = {
  title: string;
  togetherSince: string;
  handle: string;
  avatarUrl?: string | null;
  linkedPartnerLabel: string;
  daysTogether: number;
};

const PublicProfileView = () => {
  const { handle = '' } = useParams();
  const [profile, setProfile] = React.useState<PublicProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.get<PublicProfileData>(`/public-profile/${encodeURIComponent(handle)}`);
        if (!active) return;
        setProfile(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'This shared page could not be loaded.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (!handle) {
      setError('Missing profile handle.');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [handle]);

  return (
    <main className="public-profile-page">
      <style>{`
        .public-profile-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background:
            radial-gradient(circle at top right, rgba(239, 47, 90, 0.12), transparent 24%),
            radial-gradient(circle at bottom left, rgba(61, 119, 228, 0.12), transparent 26%),
            linear-gradient(180deg, #f8fbff 0%, #eef3fa 100%);
          font-family: Manrope, 'Segoe UI', sans-serif;
          color: #13213c;
        }

        .public-profile-card {
          width: min(100%, 720px);
          border-radius: 32px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 28px 70px rgba(15, 23, 42, 0.12);
          padding: 32px;
          backdrop-filter: blur(14px);
        }

        .public-profile-kicker {
          margin: 0 0 8px;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6b7d94;
          font-weight: 800;
        }

        .public-profile-title {
          margin: 0;
          font-size: clamp(2rem, 5vw, 3rem);
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .public-profile-copy,
        .public-profile-empty {
          margin: 14px 0 0;
          color: #60748c;
          font-size: 1rem;
          line-height: 1.6;
        }

        .public-profile-header {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 28px;
        }

        .public-profile-avatar,
        .public-profile-avatar-fallback {
          width: 84px;
          height: 84px;
          border-radius: 28px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .public-profile-avatar-fallback {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1d4ed8, #ef476f);
          color: #fff;
          font-size: 2rem;
          font-weight: 800;
        }

        .public-profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .public-profile-stat {
          padding: 18px;
          border-radius: 22px;
          background: linear-gradient(180deg, #f8fbff, #eef3fb);
          border: 1px solid #d8e1ef;
        }

        .public-profile-stat-label {
          display: block;
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7a8da5;
        }

        .public-profile-stat-value {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #10203b;
        }

        .public-profile-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .public-profile-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid #d8e1ef;
          background: #fff;
          color: #10203b;
          text-decoration: none;
          font-weight: 700;
        }

        .public-profile-link.primary {
          background: #10203b;
          border-color: #10203b;
          color: #fff;
        }

        @media (max-width: 640px) {
          .public-profile-card {
            padding: 24px;
            border-radius: 24px;
          }

          .public-profile-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <section className="public-profile-card" aria-live="polite">
        {loading ? (
          <>
            <p className="public-profile-kicker">Shared Couple Page</p>
            <h1 className="public-profile-title">Loading...</h1>
            <p className="public-profile-copy">Preparing this shared link now.</p>
          </>
        ) : error || !profile ? (
          <>
            <p className="public-profile-kicker">Shared Couple Page</p>
            <h1 className="public-profile-title">Link unavailable</h1>
            <p className="public-profile-empty">{error || 'This shared profile could not be found.'}</p>
            <div className="public-profile-actions">
              <Link to="/login" className="public-profile-link primary">Go to login</Link>
              <Link to="/" className="public-profile-link">Back home</Link>
            </div>
          </>
        ) : (
          <>
            <div className="public-profile-header">
              {profile.avatarUrl ? (
                <img
                  className="public-profile-avatar"
                  src={resolveApiAssetUrl(profile.avatarUrl)}
                  alt={profile.title}
                />
              ) : (
                <div className="public-profile-avatar-fallback" aria-hidden="true">
                  {profile.title.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="public-profile-kicker">Shared Couple Page</p>
                <h1 className="public-profile-title">{profile.title}</h1>
                <p className="public-profile-copy">{profile.togetherSince}</p>
              </div>
            </div>

            <div className="public-profile-grid">
              <article className="public-profile-stat">
                <span className="public-profile-stat-label">Handle</span>
                <p className="public-profile-stat-value">@{profile.handle}</p>
              </article>
              <article className="public-profile-stat">
                <span className="public-profile-stat-label">Shared Journey</span>
                <p className="public-profile-stat-value">
                  {profile.daysTogether} day{profile.daysTogether === 1 ? '' : 's'}
                </p>
              </article>
              <article className="public-profile-stat">
                <span className="public-profile-stat-label">Status</span>
                <p className="public-profile-stat-value">{profile.linkedPartnerLabel}</p>
              </article>
            </div>

            <div className="public-profile-actions">
              <Link to="/login" className="public-profile-link primary">Open BondKeeper</Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default PublicProfileView;
