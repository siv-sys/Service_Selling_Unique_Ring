import React from 'react';

const MemoriesView: React.FC = () => {
  const userName = sessionStorage.getItem('auth_name') || 'User';

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {userName}</h1>
        <p className="mt-2 text-slate-600">
          You are logged in as a user account. Admin dashboard pages are restricted to admin role.
        </p>
      </section>
    </main>
  );
};

export default MemoriesView;
