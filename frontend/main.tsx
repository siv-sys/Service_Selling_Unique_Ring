import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'tailwindcss/index.css';

document.title = 'BondKeeper - Couple Rings & Relationship Registry';

const globalStyle = document.createElement('style');
globalStyle.textContent = `
  html,
  body,
  #root {
    height: 100%;
    margin: 0;
  }

  body {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
    color: #0f172a;
    background: #f8fafc;
  }

  /* Global contrast tuning for existing utility classes */
  .text-slate-400 {
    color: #475569 !important;
  }

  .text-slate-500 {
    color: #334155 !important;
  }

  .text-slate-600 {
    color: #1e293b !important;
  }

  .border-slate-100 {
    border-color: #cbd5e1 !important;
  }

  .border-slate-200 {
    border-color: #94a3b8 !important;
  }

  .bg-slate-50 {
    background-color: #f1f5f9 !important;
  }

  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  a:focus-visible {
    outline: 2px solid #ec1380;
    outline-offset: 2px;
  }
`;
document.head.appendChild(globalStyle);

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
