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
