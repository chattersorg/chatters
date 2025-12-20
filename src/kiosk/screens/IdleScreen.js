import React, { useState, useEffect } from 'react';
import { useKiosk } from '../context/KioskContext';
import { MessageCircle } from 'lucide-react';

const IdleScreen = ({ onStart }) => {
  const { venueConfig, venueName } = useKiosk();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 cursor-pointer"
      style={{
        backgroundColor: venueConfig?.primaryColor || '#000000',
      }}
      onClick={onStart}
    >
      {/* Logo/Branding */}
      <div className="mb-12">
        {venueConfig?.logoUrl ? (
          <img
            src={venueConfig.logoUrl}
            alt={venueName}
            className="h-24 w-auto object-contain"
          />
        ) : (
          <h1 className="text-5xl font-bold text-white">
            {venueName}
          </h1>
        )}
      </div>

      {/* Main CTA */}
      <div className="text-center mb-16">
        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <MessageCircle className="w-16 h-16 text-white" />
        </div>

        <h2 className="text-4xl font-bold text-white mb-4">
          We'd love your feedback!
        </h2>
        <p className="text-2xl text-white/80">
          Tap anywhere to begin
        </p>
      </div>

      {/* Animated hint */}
      <div className="flex flex-col items-center text-white/60">
        <div className="w-16 h-1 bg-white/40 rounded-full mb-2 animate-bounce" />
        <span className="text-lg">Tap to start</span>
      </div>

      {/* Clock - bottom corner */}
      <div className="absolute bottom-8 right-8 text-right text-white/70">
        <div className="text-3xl font-light">
          {formatTime(currentTime)}
        </div>
        <div className="text-lg">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Venue name - bottom left */}
      <div className="absolute bottom-8 left-8 text-white/50 text-sm">
        {venueName}
      </div>
    </div>
  );
};

export default IdleScreen;
