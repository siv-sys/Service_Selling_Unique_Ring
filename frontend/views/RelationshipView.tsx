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
      const data = await api.patch<RelationshipResponse>(
        `/relationship/${RELATIONSHIP_ID}/privacy`,
        {
          visibility,
        }
      );
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
      const data = await api.post<RelationshipResponse>(
        `/relationship/${RELATIONSHIP_ID}/rings`,
        {
          ringIdentifier: next,
        }
      );
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
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top right, rgba(239, 47, 90, 0.16), transparent 30%),
            radial-gradient(circle at bottom left, rgba(75, 126, 235, 0.16), transparent 30%),
            linear-gradient(180deg, #f8fbff 0%, #eef3fa 100%);
          color: #101b38;
          font-family: Manrope, 'Segoe UI', sans-serif;
        }

        .relationship-page::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.25) 1px, transparent 1px);
          background-size: 120px 120px;
          mask-image: radial-gradient(circle at center, black, transparent 78%);
          opacity: 0.55;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        .relationship-topbar {
          height: 80px;
          border-bottom: 1px solid rgba(214, 225, 240, 0.9);
          background: rgba(249, 251, 255, 0.78);
          backdrop-filter: blur(18px);
          box-shadow: 0 12px 34px rgba(25, 42, 75, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
          position: sticky;
          top: 0;
          z-index: 15;
          gap: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 190px;
          white-space: nowrap;
        }

        .heart-logo {
          color: #ef2f5a;
          font-size: 28px;
          line-height: 1;
          filter: drop-shadow(0 10px 16px rgba(239, 47, 90, 0.2));
        }

        .brand-title {
          color: #0f1934;
          font-size: 25px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .top-links {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          justify-content: center;
        }

        .top-link {
          border: 0;
          background: transparent;
          color: #6f7f99;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          padding: 10px 14px;
          white-space: nowrap;
          border-radius: 999px;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }

        .top-link:hover {
          color: #23324e;
          background: rgba(255, 255, 255, 0.75);
          transform: translateY(-1px);
        }

        .top-link.active {
          color: #ef2f5a;
          background: linear-gradient(180deg, #fff2f6, #ffe8ef);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 220px;
          justify-content: flex-end;
        }

        .status-pill {
          border: 1.4px solid #ef2f5a;
          color: #ef2f5a;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(180deg, #fff3f6, #ffedf2);
          line-height: 1;
        }

        .action-icon {
          color: #61718d;
          font-size: 20px;
        }

        .mini-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 8px 16px rgba(20, 35, 62, 0.14);
          cursor: pointer;
        }

        .relationship-wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 64px 24px 72px;
        }

        .hero {
          text-align: center;
          margin-bottom: 46px;
          padding: 0 20px;
        }

        .label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid #f3cfd8;
          background: linear-gradient(180deg, #fff4f7, #ffedf2);
          color: #ef2f5a;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 12px 22px rgba(239, 47, 90, 0.08);
        }

        .hero h1 {
          margin: 18px 0 12px;
          font-size: clamp(34px, 4.8vw, 56px);
          letter-spacing: -0.05em;
          font-weight: 900;
          color: #0f1935;
          line-height: 0.98;
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
          margin-top: 20px;
          display: inline-block;
          border: 1px solid #d3dfee;
          border-radius: 999px;
          background: rgba(248, 251, 255, 0.96);
          color: #6b7d97;
          padding: 10px 18px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          box-shadow: 0 12px 22px rgba(24, 45, 81, 0.08);
        }

        .saving-note {
          margin-top: 16px;
          color: #9aabc1;
          letter-spacing: 0.17em;
          text-transform: uppercase;
          font-weight: 900;
          font-size: 13px;
        }

        .error-banner {
          margin-bottom: 18px;
          padding: 14px 18px;
          border: 1px solid #f1c5cf;
          border-radius: 16px;
          background: #fff3f6;
          color: #a33452;
          font-size: 14px;
          box-shadow: 0 10px 18px rgba(163, 52, 82, 0.07);
        }

        .certificate {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 32%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(244, 249, 255, 0.98));
          border-radius: 36px;
          border: 1px solid rgba(219, 229, 242, 0.95);
          box-shadow: 0 28px 60px rgba(29, 54, 94, 0.12);
          padding: 48px;
        }

        .certificate::after {
          content: '';
          position: absolute;
          right: -120px;
          bottom: -120px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(71, 125, 236, 0.12), transparent 70%);
          pointer-events: none;
        }

        .identity {
          display: grid;
          grid-template-columns: 1fr 190px 1fr;
          gap: 34px;
          align-items: start;
          justify-items: center;
          margin-bottom: 56px;
          border: 1px solid rgba(223, 232, 243, 0.95);
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 255, 0.95));
          padding: 30px 24px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
        }

        .user {
          text-align: center;
        }

        .avatar {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          border: 4px solid #f8fbff;
          box-shadow: 0 0 0 1px #d2ddec, 0 16px 28px rgba(23, 45, 81, 0.18);
          object-fit: cover;
          margin-bottom: 16px;
        }

        .user h2 {
          margin: 0;
          font-size: 26px;
          font-weight: 900;
          color: #131e3a;
          letter-spacing: -0.03em;
          line-height: 1.12;
        }

        .user span {
          color: #8e9bb3;
          font-size: 15px;
          font-weight: 700;
          display: block;
          margin-top: 5px;
        }

        .center-info {
          text-align: center;
          padding-top: 8px;
        }

        .center-heart {
          width: 72px;
          height: 72px;
          border: 1px solid #d9dfeb;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #ef2f5a;
          margin: 0 auto 14px;
          font-size: 34px;
          background: linear-gradient(180deg, #fff4f7, #ffeff3);
          box-shadow: 0 16px 26px rgba(239, 47, 90, 0.14);
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
          margin: 8px 0 0;
          color: #17223e;
          font-size: 30px;
          font-weight: 900;
          line-height: 1.15;
        }

        .center-info .days {
          margin: 4px 0 0;
          color: #9ba8bc;
          font-size: 16px;
          font-weight: 700;
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
          display: flex;
          flex-direction: column;
          min-height: 390px;
          padding: 34px 34px 30px;
          border: 1px solid rgba(209, 220, 236, 0.95);
          border-radius: 30px;
          background:
            radial-gradient(circle at top right, rgba(239, 47, 90, 0.08), transparent 28%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.96));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 18px 34px rgba(30, 52, 88, 0.08);
        }

        .card h4 {
          margin: 0 0 10px;
          font-size: clamp(26px, 3vw, 34px);
          font-weight: 900;
          color: #141f39;
          letter-spacing: -0.04em;
          line-height: 0.96;
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
          font-weight: 800;
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

        .option:hover {
          transform: translateY(-1px);
          border-color: #b9c8dc;
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

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #d7e1ee, transparent);
          margin-bottom: 32px;
        }

        .linked h5 {
          margin: 0 0 16px;
          font-size: 28px;
          color: #141e38;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .linked-box {
          min-height: 108px;
          border-radius: 24px;
          border: 1px dashed #d2dce9;
          color: #8b9bb3;
          background: linear-gradient(180deg, rgba(247, 250, 255, 0.96), rgba(242, 247, 253, 0.96));
          display: grid;
          place-items: center;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
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

        .ring-list {
          margin: 16px 0 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ring-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #d5deeb;
          border-radius: 999px;
          background: linear-gradient(180deg, #f7faff, #edf3fb);
          padding: 9px 14px;
          font-size: 13px;
          color: #31435f;
          font-weight: 800;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
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

        .footer {
          margin-top: 54px;
          text-align: center;
          color: #b7c4d7;
          text-transform: uppercase;
          letter-spacing: 0.38em;
          font-size: 11px;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .relationship-topbar {
            padding: 0 18px;
          }

          .top-links {
            overflow-x: auto;
            justify-content: flex-start;
            padding-bottom: 4px;
          }

          .grid-cards {
            grid-template-columns: 1fr;
          }

          .card {
            min-height: auto;
          }
        }

        @media (max-width: 680px) {
          .relationship-topbar {
            height: auto;
            padding: 14px;
            flex-wrap: wrap;
          }

          .brand,
          .top-actions {
            min-width: auto;
          }

          .top-links {
            order: 3;
            width: 100%;
            margin-top: 0;
          }

          .relationship-wrap {
            padding: 36px 14px 48px;
          }

          .hero {
            padding: 0;
          }

          .hero h1 {
            font-size: clamp(30px, 8vw, 42px);
          }

          .certificate {
            padding: 22px 16px;
            border-radius: 28px;
          }

          .identity {
            grid-template-columns: 1fr;
            gap: 22px;
            margin-bottom: 28px;
            padding: 24px 16px;
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
          <button className="top-link" type="button" onClick={onNavigateCoupleProfile}>
            Couple Profile
          </button>
          <button className="top-link active" type="button">
            Relationship
          </button>
          <button className="top-link" type="button" onClick={onNavigateSettings}>
            Settings
          </button>
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
          <span className="label">{'\u2726'} Shared Bond Overview</span>
          <h1>Your Relationship Space</h1>
          <p>Manage your pair details, privacy settings, and connected rings in one place.</p>
          <span className="pair-code">{pairCode}</span>
          {saving && <p className="saving-note">Saving</p>}
        </section>

        <section className="certificate">
          <div className="identity">
            <article className="user">
              <img
                className="avatar"
                src={owner?.avatarUrl || fallbackAvatar}
                alt={owner?.fullName || 'Owner'}
              />
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
              <img
                className="avatar"
                src={partner?.avatarUrl || fallbackAvatar}
                alt={partner?.fullName || 'Partner'}
              />
              <h2>{partner?.fullName || (loading ? 'Loading...' : 'Unknown Member')}</h2>
              <span>@{partner?.username || 'unknown'}</span>
            </article>
          </div>

          <div className="grid-cards">
            <section className="card">
              <h4>Pair Details</h4>
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
                  <span>Pair Code:</span>
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
              <div className="card-actions">
                <button
                  className="solid-btn"
                  type="button"
                  onClick={handleSaveMetadata}
                  disabled={saving}
                >
                  Save Changes
                </button>
                <button
                  className="outline-btn"
                  type="button"
                  onClick={handleUnpair}
                  disabled={saving}
                >
                  Unpair Relationship
                </button>
              </div>
            </section>

            <section className="card">
              <h4>Privacy Settings</h4>
              <p className="helper">Choose how your relationship appears across the experience.</p>
              <div className="options">
                <label className={`option ${visibility === 'public' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={(event) => setVisibility(event.target.value)}
                  />
                  <span>Visible to Everyone</span>
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
                  <span>Only for Partners</span>
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
                  <span>Hidden from Others</span>
                  <span className="dot" />
                </label>
              </div>
              <div className="card-actions">
                <button
                  className="solid-btn"
                  type="button"
                  onClick={handleSaveVisibility}
                  disabled={saving}
                >
                  Update Privacy
                </button>
              </div>
            </section>
          </div>

          <div className="divider" />

          <section className="linked">
            <h5>Connected Rings</h5>
            <div className="linked-box">
              {loading
                ? 'Loading connected rings...'
                : linkedRings.length === 0
                  ? 'No rings connected yet.'
                  : `${linkedRings.length} ring(s) currently connected.`}
            </div>
            <div className="linked-controls">
              <input
                className="ring-input"
                value={ringInput}
                onChange={(event) => setRingInput(event.target.value)}
                placeholder="Enter a ring ID"
              />
              <button
                className="ring-add-btn"
                type="button"
                onClick={handleAddRing}
                disabled={saving}
              >
                Connect Ring
              </button>
            </div>
            {linkedRings.length > 0 && (
              <ul className="ring-list">
                {linkedRings.map((ring) => (
                  <li className="ring-item" key={ring.linkId}>
                    <span>{ring.ringIdentifier}</span>
                    <button
                      className="ring-remove"
                      type="button"
                      onClick={() => handleRemoveRing(ring.id)}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>

        <p className="footer">Designed for two {'\u2022'} always in sync</p>
      </main>
    </div>
  );
};

export default RelationshipView;
