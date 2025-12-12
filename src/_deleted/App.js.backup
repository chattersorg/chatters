// App.js
import './index.css';
import './styles/modern-dashboard.css';
import React, { useEffect, useState } from 'react';
import { ModalProvider } from './context/ModalContext';
import { LoadingProvider } from './context/LoadingContext';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import * as Sentry from "@sentry/react";
import MarketingRoutes from './MarketingRoutes';
import AppRoutes from './AppRoutes'; // ✅ now controls dashboard vs admin

Sentry.init({
  dsn: "https://e4e4170e47a3d8d9bbdacb71d59fb96e@o4509429646622720.ingest.de.sentry.io/4510018410381392",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.replayIntegration()
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

function App() {
  const [isDashboardDomain, setIsDashboardDomain] = useState(false);
  const [isDevSite, setIsDevSite] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDashboardDomain(
        window.location.hostname.startsWith('my.') || 
        window.location.hostname.includes('.my.')
      );

      // Check if this is a dev site
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isDevDomain = hostname.includes('dev') || hostname.includes('staging') || hostname.includes('test');
      const isVercelPreview = hostname.includes('vercel.app') && !hostname.includes('getchatters.com');
      
      setIsDevSite(isLocalhost || isDevDomain || isVercelPreview);

      const hash = window.location.hash;

      if (hash.includes('type=recovery') && !window.location.pathname.includes('/reset-password')) {
        const redirectUrl = `/reset-password${hash}`;
        window.location.replace(redirectUrl);
        return;
      }

      if (hash.includes('type=invite') && !window.location.pathname.includes('/set-password')) {
        const redirectUrl = `/set-password${hash}`;
        window.history.replaceState(null, '', redirectUrl);
      }
    }
  }, []);

  return (
    <div className={isDashboardDomain ? 'font-sans' : 'font-marketing'}>
      {/* Dev Site Banner */}
      {isDevSite && (
        <div className="bg-orange-500 text-white text-xs text-center py-1 px-4 font-medium">
          Dev Site - Expect bugs and incomplete features
        </div>
      )}
      
      <LoadingProvider>
        <ModalProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Sentry.ErrorBoundary fallback={<p>Something went wrong!</p>} showDialog>
            {isDashboardDomain ? <AppRoutes /> : <MarketingRoutes />}
          </Sentry.ErrorBoundary>
          <Analytics />
          <SpeedInsights />
        </ModalProvider>
      </LoadingProvider>
    </div>
  );
}

export default App;
