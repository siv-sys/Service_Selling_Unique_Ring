import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import UserPairMgmt from './views/UserPairMgmt';
import SecurityLogsView from './views/SecurityLogsView';
import AdminSeedView from './views/AdminSeedView';
import SettingsView from './views/SettingsView';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard route */}
          <Route path="/dashboard" element={<DashboardView />} />

          {/* Inventory route */}
          <Route path="/inventory" element={<InventoryView />} />

          {/* User & pair page intentionally empty */}
          <Route path="/users" element={<UserPairMgmt />} />

          {/* Intentionally empty pages */}
          <Route path="/security" element={<SecurityLogsView />} />
          <Route path="/catalog" element={<AdminSeedView />} />
          <Route path="/settings" element={<SettingsView />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
