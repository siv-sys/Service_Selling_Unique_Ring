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

  .text-slate-700 {
    color: #0f172a !important;
  }

  .text-primary\\/70 {
    color: #be0f66 !important;
  }

  .border-slate-100 {
    border-color: #cbd5e1 !important;
  }

  .border-slate-200 {
    border-color: #94a3b8 !important;
  }

  .border-slate-300 {
    border-color: #64748b !important;
  }

  .border-primary\\/5,
  .border-primary\\/10,
  .border-primary\\/20 {
    border-color: rgba(236, 19, 128, 0.4) !important;
  }

  .bg-slate-50 {
    background-color: #f1f5f9 !important;
  }

  .bg-primary\\/5 {
    background-color: rgba(236, 19, 128, 0.12) !important;
  }

  .bg-primary\\/10 {
    background-color: rgba(236, 19, 128, 0.18) !important;
  }

  .divide-slate-100 > :not([hidden]) ~ :not([hidden]) {
    border-color: #cbd5e1 !important;
  }

  .divide-primary\\/5 > :not([hidden]) ~ :not([hidden]) {
    border-color: rgba(236, 19, 128, 0.35) !important;
  }

  input::placeholder,
  textarea::placeholder {
    color: #64748b !important;
    opacity: 1;
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
