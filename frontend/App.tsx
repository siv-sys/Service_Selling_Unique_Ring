import React from 'react';
import RelationshipView from './views/RelationshipView';


export default function App() {
  const [view, setView] = React.useState('relationship');

  return (
    <RelationshipView
      onNavigateCoupleProfile={() => setView('coupleProfile')}
    />
  );
}
