import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './components/index.css';
import './index.css';

document.title = 'BondKeeper - Couple Rings & Relationship Registry';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
