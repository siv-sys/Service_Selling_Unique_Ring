import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardView from './views/DashboardView_admin';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/users" element={<DashboardView />} />
          <Route path="/inventory" element={<DashboardView />} />
          <Route path="/security" element={<DashboardView />} />
          <Route path="/catalog" element={<DashboardView />} />
          <Route path="/settings" element={<DashboardView />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
