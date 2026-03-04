import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import InventoryView from './views/InventoryView';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/inventory" replace />} />
          <Route path="/inventory" element={<InventoryView />} />
          <Route path="*" element={<Navigate to="/inventory" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
