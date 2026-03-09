import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard routes */}
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/users" element={<DashboardView />} />
          <Route path="/security" element={<DashboardView />} />
          <Route path="/catalog" element={<DashboardView />} />
          <Route path="/settings" element={<DashboardView />} />

          {/* Inventory route */}
          <Route path="/inventory" element={<InventoryView />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}