import React from 'react';
import { api } from '../lib/api';

const RELATIONSHIP_ID = 1;

type RelationshipMember = {
  id: number;
  role: 'OWNER' | 'PARTNER';
  fullName: string;
  username: string;
  avatarUrl: string | null;
};

type LinkedRing = {
  id: number;
  linkId: number;
  ringIdentifier: string;
};

type RelationshipResponse = {
  pairId: number;
  pairCode: string;
  access: 'GRANTED' | 'REVOKED';
  status: 'PAIRED' | 'UNPAIRED' | 'PUBLIC' | 'PARTNERS' | 'PRIVATE';
  visibility: 'public' | 'partners' | 'private';
  establishedAt: string | null;
  members: RelationshipMember[];
  linkedRings: LinkedRing[];
};

const fallbackAvatar =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80';

const RelationshipView = ({
  onNavigateSettings = () => {},
  onNavigateCoupleProfile = () => {},
  onNavigateProfile = () => {},
}) => {
  const [access, setAccess] = React.useState('REVOKED');
  const [pairCode, setPairCode] = React.useState('PAIR001');
  const [status, setStatus] = React.useState('UNPAIRED');
  const [visibility, setVisibility] = React.useState('partners');
  const [ringInput, setRingInput] = React.useState('');
  const [linkedRings, setLinkedRings] = React.useState<LinkedRing[]>([]);
  const [members, setMembers] = React.useState<RelationshipMember[]>([]);
  const [establishedAt, setEstablishedAt] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const applyRelationshipData = React.useCallback((data: RelationshipResponse) => {
    setAccess(data.access);
    setPairCode(data.pairCode);
    setStatus(data.status);
    setVisibility(data.visibility);
    setLinkedRings(data.linkedRings);
    setMembers(data.members);
    setEstablishedAt(data.establishedAt);
  }, []);

  React.useEffect(() => {
    let active = true;

    const loadRelationship = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.get<RelationshipResponse>(`/relationship/${RELATIONSHIP_ID}`);
        if (!active) return;
        applyRelationshipData(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load relationship.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRelationship();

    return () => {
      active = false;
    };
  }, [applyRelationshipData]);

  const owner = members[0];
  const partner = members[1];

  const formattedEstablishedAt = establishedAt
    ? new Date(`${establishedAt}T00:00:00`).toLocaleDateString('en-US')
    : 'Not set';

  const handleUnpair = async () => {
    try {
      setSaving(true);
      setError('');
      const data = await api.patch<RelationshipResponse>(`/relationship/${RELATIONSHIP_ID}`, {
        access: 'REVOKED',
        pairCode,
        status: 'UNPAIRED',
      });
      applyRelationshipData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpair relationship.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMetadata = async () => {
    try {
      setSaving(true);
      setError('');
      const data = await api.patch<RelationshipResponse>(`/relationship/${RELATIONSHIP_ID}`, {
        access,
        pairCode,
        status,
      });
      applyRelationshipData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pair metadata.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVisibility = async () => {
    try {
      setSaving(true);
      setError('');
      const data = await api.patch<RelationshipResponse>(`/relationship/${RELATIONSHIP_ID}/privacy`, {
        visibility,
      });
      applyRelationshipData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save visibility.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRing = async () => {
    const next = ringInput.trim().toUpperCase();
    if (!next) return;

    try {
      setSaving(true);
      setError('');
      const data = await api.post<RelationshipResponse>(`/relationship/${RELATIONSHIP_ID}/rings`, {
        ringIdentifier: next,
      });
      applyRelationshipData(data);
      setRingInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ring.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRing = async (ringId: number) => {
    try {
      setSaving(true);
      setError('');
      const data = await api.delete<RelationshipResponse>(
        `/relationship/${RELATIONSHIP_ID}/rings/${ringId}`
      );
      applyRelationshipData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove ring.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relationship-page">
      <style>{`
        .relationship-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 100% -8%, rgba(234, 63, 104, 0.12), transparent 36%),
            radial-gradient(circle at -10% 110%, rgba(71, 125, 236, 0.14), transparent 34%),
            #f3f6fb;
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
          border-bottom: 1px solid #d8e1ee;
          background: rgba(248, 251, 255, 0.85);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 20px rgba(19, 38, 72, 0.07);
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
          background: #fff1f5;
          border-radius: 999px;
          padding: 8px 12px 18px;
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
          border: 1px solid #f3cfd8;
          background: #fff0f4;
          color: #ef2f5a;
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
          color: #0f1935;
          line-height: 1.06;
        }

        .hero p,
        .error-banner {
          margin: 0;
          color: #6d7e9a;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.45;
        }

        .pair-code {
          margin-top: 18px;
          display: inline-block;
          border: 1px solid #d3dfee;
          border-radius: 999px;
          background: #f8fbff;
          color: #7d8ea8;
          padding: 7px 14px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .error-banner {
          margin-bottom: 16px;
          padding: 12px 16px;
          border: 1px solid #f1c5cf;
          border-radius: 14px;
          background: #fff3f6;
          color: #a33452;
          font-size: 14px;
        }

        .certificate {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(248, 251, 255, 0.95));
          border-radius: 28px;
          border: 1px solid #dbe5f2;
          box-shadow: 0 20px 42px rgba(29, 54, 94, 0.11);
          padding: 44px;
          position: relative;
          overflow: hidden;
        }

        .identity {
          display: grid;
          grid-template-columns: 1fr 170px 1fr;
          gap: 34px;
          align-items: start;
          justify-items: center;
          margin-bottom: 52px;
          border: 1px solid #dfe8f3;
          border-radius: 22px;
          background: linear-gradient(180deg, #ffffff, #f8fbff);
          padding: 24px 18px;
        }

        .user {
          text-align: center;
        }

        .avatar {
          width: 104px;
          height: 104px;
          border-radius: 50%;
          border: 4px solid #f8fbff;
          box-shadow: 0 0 0 1px #d2ddec, 0 10px 18px rgba(23, 45, 81, 0.18);
          object-fit: cover;
          margin-bottom: 14px;
        }

        .user h2 {
          margin: 0;
          font-size: 32px;
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
          background: linear-gradient(180deg, #fff4f7, #ffeff3);
        }

        .center-info .kicker,
        .saving-note {
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
          font-size: 34px;
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
          align-items: stretch;
        }

        .card {
          position: relative;
          border: 1px solid rgba(209, 220, 236, 0.95);
          border-radius: 30px;
          background:
            radial-gradient(circle at top right, rgba(239, 47, 90, 0.08), transparent 28%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.96));
          min-height: 390px;
          padding: 34px 34px 30px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 18px 34px rgba(30, 52, 88, 0.08);
          display: flex;
          flex-direction: column;
        }

        .card h4 {
          margin: 0 0 10px;
          font-size: clamp(32px, 4vw, 44px);
          font-weight: 900;
          color: #141f39;
          letter-spacing: -0.03em;
          line-height: 0.95;
        }

        .meta {
          margin-top: 22px;
          display: grid;
          gap: 16px;
        }

        .row {
          display: grid;
          grid-template-columns: 108px minmax(0, 1fr);
          align-items: center;
          color: #71829c;
          font-size: 14px;
          gap: 10px;
        }

        .row span {
          min-width: 74px;
          font-weight: 700;
          color: #587095;
          font-size: 15px;
        }

        .field-input,
        .field-select,
        .ring-input {
          flex: 1;
          height: 56px;
          border-radius: 16px;
          border: 1px solid #cad8ea;
          background: rgba(252, 253, 255, 0.98);
          color: #1f2c47;
          padding: 0 18px;
          font-size: 15px;
          font-weight: 800;
          font-family: inherit;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
          transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        }

        .field-input:focus,
        .field-select:focus,
        .ring-input:focus {
          outline: none;
          border-color: rgba(239, 47, 90, 0.55);
          box-shadow: 0 0 0 4px rgba(239, 47, 90, 0.12);
          transform: translateY(-1px);
        }

        .outline-btn,
        .solid-btn,
        .ring-add-btn {
          margin-top: 22px;
          border-radius: 18px;
          font-weight: 900;
          padding: 14px 24px;
          cursor: pointer;
          font-size: 15px;
          font-family: inherit;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease,
            background 0.18s ease;
        }

        .outline-btn:hover,
        .solid-btn:hover,
        .ring-add-btn:hover {
          transform: translateY(-1px);
        }

        .outline-btn:disabled,
        .solid-btn:disabled,
        .ring-add-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .outline-btn {
          border: 1.5px solid rgba(239, 47, 90, 0.8);
          color: #ef2f5a;
          background: rgba(255, 240, 245, 0.95);
          min-width: 210px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .helper {
          margin: 10px 0 0;
          color: #98a7bc;
          text-transform: uppercase;
          letter-spacing: 0.11em;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.5;
        }

        .options {
          margin-top: 24px;
          display: grid;
          gap: 14px;
        }

        .option {
          position: relative;
          min-height: 66px;
          border-radius: 20px;
          border: 1px solid #cfd9e7;
          background: rgba(248, 251, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px 0 20px;
          color: #4d5e7a;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease,
            transform 0.18s ease;
        }

        .option input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .option .dot {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid #8f9eb5;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.8);
        }

        .option.active {
          border-color: #ef2f5a;
          color: #1b2642;
          background: linear-gradient(180deg, rgba(255, 244, 248, 0.98), rgba(255, 237, 242, 0.98));
          box-shadow: 0 12px 22px rgba(239, 47, 90, 0.12);
        }

        .option:hover {
          transform: translateY(-1px);
          border-color: #b9c8dc;
        }

        .option.active .dot {
          border-color: #ef2f5a;
          background: #ef2f5a;
        }

        .option.active .dot::after {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
        }

        .linked-controls {
          margin-top: 18px;
          display: flex;
          gap: 14px;
          align-items: stretch;
          padding: 14px;
          border: 1px solid #d8e2ef;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 250, 255, 0.96));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
        }

        .ring-add-btn {
          border: 1px solid #ef2f5a;
          background: linear-gradient(180deg, rgba(255, 243, 247, 0.98), rgba(255, 236, 242, 0.98));
          color: #ef2f5a;
          height: 56px;
          white-space: nowrap;
          min-width: 160px;
          margin-top: 0;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .ring-input {
          flex: 1;
          min-width: 0;
          border-radius: 18px;
          background: #ffffff;
        }

        .ring-input::placeholder {
          color: #7f8ca2;
          font-weight: 700;
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
          min-width: 170px;
          box-shadow: 0 16px 24px rgba(226, 33, 76, 0.24);
        }

        .card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: auto;
          padding-top: 28px;
        }

        .card-actions .outline-btn,
        .card-actions .solid-btn {
          margin-top: 0;
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
          background: #f7faff;
          display: grid;
          place-items: center;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 10px;
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

        @media (max-width: 900px) {
          .grid-cards {
            grid-template-columns: 1fr;
          }

          .card {
            min-height: auto;
          }
        }

        @media (max-width: 680px) {
          .relationship-wrap {
            padding: 34px 14px 48px;
          }

          .certificate {
            padding: 22px 16px;
          }

          .identity {
            grid-template-columns: 1fr;
            gap: 22px;
            margin-bottom: 28px;
          }

          .card {
            padding: 24px 18px 22px;
            border-radius: 24px;
          }

          .row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .card-actions {
            flex-direction: column;
          }

          .card-actions .outline-btn,
          .card-actions .solid-btn,
          .ring-add-btn {
            width: 100%;
          }

          .linked-controls {
            flex-direction: column;
            align-items: stretch;
            padding: 12px;
          }
        }
      `}</style>

      <header className="relationship-topbar">
        <div className="brand">
          <span className="heart-logo">{'\u2764'}</span>
          <span className="brand-title">Eternal Rings</span>
        </div>

        <div className="top-links" aria-label="Primary navigation">
          <button className="top-link">Dashboard</button>
          <button className="top-link">Ring Scan</button>
          <button className="top-link">My Ring</button>
          <button className="top-link" type="button" onClick={onNavigateCoupleProfile}>Couple Profile</button>
          <button className="top-link active" type="button">Relationship</button>
          <button className="top-link" type="button" onClick={onNavigateSettings}>Settings</button>
        </div>

        <div className="top-actions">
          <span className="status-pill">{'\u2923'} {status}</span>
          <span className="action-icon">{'\u263E'}</span>
          <span className="action-icon">{'\u{1F514}'}</span>
          <img
            className="mini-avatar"
            src={owner?.avatarUrl || fallbackAvatar}
            alt="Member"
            onClick={onNavigateProfile}
          />
        </div>
      </header>

      <main className="relationship-wrap">
        {error && <div className="error-banner">{error}</div>}

        <section className="hero">
          <span className="label">{'\u2726'} Relationship Page Connected To Backend</span>
          <h1>Relationship Certificate</h1>
          <p>Live relationship profile from your database.</p>
          <span className="pair-code">{pairCode}</span>
          {saving && <p className="saving-note">Saving</p>}
        </section>

        <section className="certificate">
          <div className="identity">
            <article className="user">
              <img className="avatar" src={owner?.avatarUrl || fallbackAvatar} alt={owner?.fullName || 'Owner'} />
              <h2>{owner?.fullName || (loading ? 'Loading...' : 'Unknown Member')}</h2>
              <span>@{owner?.username || 'unknown'}</span>
            </article>

            <article className="center-info">
              <div className="center-heart">{'\u2764'}</div>
              <p className="kicker">Established</p>
              <p className="date">{formattedEstablishedAt}</p>
              <p className="days">Pair ID {RELATIONSHIP_ID}</p>
            </article>

            <article className="user">
              <img className="avatar" src={partner?.avatarUrl || fallbackAvatar} alt={partner?.fullName || 'Partner'} />
              <h2>{partner?.fullName || (loading ? 'Loading...' : 'Unknown Member')}</h2>
              <span>@{partner?.username || 'unknown'}</span>
            </article>
          </div>

          <div className="grid-cards">
            <section className="card">
              <h4>Pair Metadata</h4>
              <div className="meta">
                <label className="row">
                  <span>Access:</span>
                  <select className="field-select" value={access} onChange={(event) => setAccess(event.target.value)}>
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
                  <select className="field-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="PAIRED">PAIRED</option>
                    <option value="UNPAIRED">UNPAIRED</option>
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="PARTNERS">PARTNERS</option>
                    <option value="PRIVATE">PRIVATE</option>
                  </select>
                </label>
              </div>
              <div className="card-actions">
                <button className="solid-btn" type="button" onClick={handleSaveMetadata} disabled={saving}>
                  Save Metadata
                </button>
                <button className="outline-btn" type="button" onClick={handleUnpair} disabled={saving}>
                  Unpair Relationship
                </button>
              </div>
            </section>

            <section className="card">
              <h4>Privacy Vault</h4>
              <p className="helper">Visibility mode from 'proximity_preferences'.</p>
              <div className="options">
                <label className={`option ${visibility === 'public' ? 'active' : ''}`}>
                  <input type="radio" name="visibility" value="public" checked={visibility === 'public'} onChange={(event) => setVisibility(event.target.value)} />
                  <span>Public Presence</span>
                  <span className="dot" />
                </label>
                <label className={`option ${visibility === 'partners' ? 'active' : ''}`}>
                  <input type="radio" name="visibility" value="partners" checked={visibility === 'partners'} onChange={(event) => setVisibility(event.target.value)} />
                  <span>Partners Only</span>
                  <span className="dot" />
                </label>
                <label className={`option ${visibility === 'private' ? 'active' : ''}`}>
                  <input type="radio" name="visibility" value="private" checked={visibility === 'private'} onChange={(event) => setVisibility(event.target.value)} />
                  <span>Private</span>
                  <span className="dot" />
                </label>
              </div>
              <div className="card-actions">
                <button className="solid-btn" type="button" onClick={handleSaveVisibility} disabled={saving}>
                  Save Visibility
                </button>
              </div>
            </section>
          </div>

          <div className="divider" />

          <section className="linked">
            <h5>Linked Rings</h5>
            <div className="linked-box">
              {loading ? 'Loading rings...' : linkedRings.length === 0 ? 'No rings linked.' : `${linkedRings.length} ring(s) linked.`}
            </div>
            <div className="linked-controls">
              <input
                className="ring-input"
                value={ringInput}
                onChange={(event) => setRingInput(event.target.value)}
                placeholder="Enter ring id"
              />
              <button className="ring-add-btn" type="button" onClick={handleAddRing} disabled={saving}>
                Add Ring
              </button>
            </div>
            {linkedRings.length > 0 && (
              <ul className="ring-list">
                {linkedRings.map((ring) => (
                  <li className="ring-item" key={ring.linkId}>
                    <span>{ring.ringIdentifier}</span>
                    <button className="ring-remove" type="button" onClick={() => handleRemoveRing(ring.id)} disabled={saving}>
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
