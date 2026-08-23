import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Automatically attach household and device tokens to all /api requests
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url;
  if (url && (url.startsWith('/api') || (typeof url === 'string' && url.includes('/api/')))) {
    const headers = new Headers(init.headers || {});
    const householdId = localStorage.getItem('cq_household_id');
    const deviceToken = localStorage.getItem('cq_device_token');
    if (householdId && !headers.has('x-household-id')) {
      headers.set('x-household-id', householdId);
    }
    if (deviceToken && !headers.has('x-device-token')) {
      headers.set('x-device-token', deviceToken);
    }
    init = { ...init, headers };
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

