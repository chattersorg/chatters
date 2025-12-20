import React, { useState, useEffect } from 'react';
import { KioskProvider, useKiosk } from './context/KioskContext';
import PairingScreen from './screens/PairingScreen';
import IdleScreen from './screens/IdleScreen';
import FeedbackFlow from './screens/FeedbackFlow';
import { Loader2, Settings, RefreshCw } from 'lucide-react';

// Secret tap pattern for admin access: tap 5 times in corner
const ADMIN_TAP_COUNT = 5;
const ADMIN_TAP_TIMEOUT = 3000;

const KioskContent = () => {
  const { isPaired, isLoading, error, clearPairing, refreshConfig } = useKiosk();
  const [screen, setScreen] = useState('idle'); // idle | feedback | admin
  const [adminTaps, setAdminTaps] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // Reset admin taps after timeout
  useEffect(() => {
    if (adminTaps > 0 && Date.now() - lastTapTime > ADMIN_TAP_TIMEOUT) {
      setAdminTaps(0);
    }
  }, [adminTaps, lastTapTime]);

  // Handle secret admin tap (in top-left corner)
  const handleAdminTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isInCorner = e.clientX < rect.left + 100 && e.clientY < rect.top + 100;

    if (isInCorner) {
      const now = Date.now();
      if (now - lastTapTime < ADMIN_TAP_TIMEOUT) {
        setAdminTaps((prev) => prev + 1);
      } else {
        setAdminTaps(1);
      }
      setLastTapTime(now);

      if (adminTaps + 1 >= ADMIN_TAP_COUNT) {
        setShowAdminMenu(true);
        setAdminTaps(0);
      }
    }
  };

  const handleStartFeedback = () => {
    setScreen('feedback');
  };

  const handleFeedbackComplete = () => {
    setScreen('idle');
  };

  const handleFeedbackCancel = () => {
    setScreen('idle');
  };

  const handleUnpair = () => {
    clearPairing();
    setShowAdminMenu(false);
  };

  const handleRefresh = () => {
    refreshConfig();
    window.location.reload();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading kiosk...</p>
        </div>
      </div>
    );
  }

  // Not paired - show pairing screen
  if (!isPaired) {
    return <PairingScreen />;
  }

  // Admin menu overlay
  if (showAdminMenu) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Kiosk Settings</h2>
            </div>
            <button
              onClick={() => setShowAdminMenu(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-2xl text-gray-400">&times;</span>
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleRefresh}
              className="w-full py-4 px-6 flex items-center gap-3 rounded-xl border border-gray-200
                hover:bg-gray-50 transition-colors text-left"
            >
              <RefreshCw className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Refresh Configuration</p>
                <p className="text-sm text-gray-500">Reload venue settings</p>
              </div>
            </button>

            <button
              onClick={handleUnpair}
              className="w-full py-4 px-6 flex items-center gap-3 rounded-xl border border-red-200
                hover:bg-red-50 transition-colors text-left"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-red-500 text-xl">⚠</span>
              </div>
              <div>
                <p className="font-medium text-red-600">Unpair Device</p>
                <p className="text-sm text-gray-500">Remove this device from venue</p>
              </div>
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            Tap 5 times in top-left corner to access this menu
          </p>
        </div>
      </div>
    );
  }

  // Main kiosk screens
  return (
    <div
      className="min-h-screen"
      onClick={handleAdminTap}
    >
      {screen === 'idle' && (
        <IdleScreen onStart={handleStartFeedback} />
      )}

      {screen === 'feedback' && (
        <FeedbackFlow
          onComplete={handleFeedbackComplete}
          onCancel={handleFeedbackCancel}
        />
      )}
    </div>
  );
};

const KioskApp = () => {
  // Prevent zoom on double-tap (iOS)
  useEffect(() => {
    const preventZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, []);

  // Lock orientation to landscape (when running as native app)
  useEffect(() => {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {
        // Orientation lock not supported or not allowed
      });
    }
  }, []);

  return (
    <KioskProvider>
      <KioskContent />
    </KioskProvider>
  );
};

export default KioskApp;
