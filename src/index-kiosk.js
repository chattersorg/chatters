// Kiosk App Entry Point - for Capacitor native app builds
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import KioskApp from './kiosk/KioskApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <KioskApp />
  </React.StrictMode>
);
