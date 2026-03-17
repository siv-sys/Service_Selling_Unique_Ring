import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardView from './views/DashboardView_admin';
import InventoryView from './views/InventoryView';
import UserPairMgmt from './views/UserPairMgmt';
import AdminSeedView from './views/AdminSeedView';
import SettingsView from './views/SettingsView';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/inventory" element={<InventoryView />} />
          <Route path="/users" element={<UserPairMgmt />} />
          <Route path="/catalog" element={<AdminSeedView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
