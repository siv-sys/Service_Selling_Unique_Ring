import React from 'react';

type SettingsViewProps = {
  onNavigateRelationship?: () => void;
  onNavigateCoupleProfile?: () => void;
  onNavigateProfile?: () => void;
};

const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigateRelationship = () => {},
  onNavigateCoupleProfile = () => {},
  onNavigateProfile = () => {},
}) => {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fc', color: '#1f2937', fontFamily: 'Segoe UI, sans-serif' }}>
      <header
        style={{
          height: 72,
          borderBottom: '1px solid #ece7ed',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f542a7', fontSize: 32, fontFamily: 'Times New Roman, Georgia, serif', fontWeight: 600 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>diamond</span>
          <span>BondKeeper</span>
        </div>
        <nav style={{ display: 'flex', gap: 18, fontSize: 14 }}>
          <button type="button" onClick={onNavigateProfile} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>Dashboard</button>
          <button type="button" onClick={onNavigateCoupleProfile} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>Couple Shop</button>
          <button type="button" onClick={onNavigateRelationship} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>Relationship</button>
          <button type="button" style={{ border: 0, background: 'transparent', color: '#f542a7', fontWeight: 700, cursor: 'pointer' }}>Settings</button>
        </nav>
      </header>

      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Settings</h1>
        <p style={{ marginTop: 10, color: '#6b7280' }}>Settings page is now connected in navigation.</p>
      </main>
    </div>
  );
};

export default SettingsView;
