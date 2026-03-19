import React from 'react';
import ProfileView from './views/ProfileView';

export default function App() {
  return (
    <ProfileView
      onNavigateDashboard={() => {}}
      onNavigateCoupleShop={() => {}}
      onNavigateMyRing={() => {}}
      onNavigateRelationship={() => {}}
      onNavigateSettings={() => {}}
      onNavigateCoupleProfile={() => {}}
    />
  );
}