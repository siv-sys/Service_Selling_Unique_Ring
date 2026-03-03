import React, { useState } from 'react';
import Navbar from './views/layout/navbar';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  return (
    <div className="min-h-screen bg-[#faf9fb] text-slate-900">
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        userName="Alex & Jamie"
        userAvatarUrl="https://i.pravatar.cc/100?img=47"
      />
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8 lg:px-10">
        <p className="text-sm text-slate-500">Current page: {currentView}</p>
      </main>
    </div>
  );
};

export default App;
