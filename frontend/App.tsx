import React from 'react';
import ProfileView from './views/ProfileView';

export default function App() {
  const [view, setView] = React.useState('profile');

  if (view === 'profile') {
    return (
      <ProfileView
        onNavigateCoupleProfile={() => setView('coupleProfile')}
      />
    );
  }

  return (
    <ProfileView
      onNavigateCoupleProfile={() => setView('coupleProfile')}
    />
  );
}
