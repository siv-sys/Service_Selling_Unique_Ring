import React from 'react';
import SettingsView from './views/SettingsView';

export default function App() {
  const [view, setView] = React.useState('settings');

  if (view === 'settings') {
    return (
      <SettingsView
        onNavigateRelationship={() => setView('relationship')}
        onNavigateCoupleProfile={() => setView('coupleProfile')}
        onNavigateProfile={() => setView('settings')}
      />
    );
  }
  return (
    <SettingsView
      onNavigateRelationship={() => setView('relationship')}
      onNavigateCoupleProfile={() => setView('coupleProfile')}
      onNavigateProfile={() => setView('settings')}
    />
  );
}
