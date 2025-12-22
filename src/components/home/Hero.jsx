import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, MessageSquare, TrendingUp, Star } from 'lucide-react';

// Table component with ping animation - styled like kiosk mode alerts
const Table = ({ className, color, shape }) => {
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    // Random initial delay between 0-3 seconds
    const initialDelay = Math.random() * 3000;

    const startPinging = () => {
      // Random interval between pings (2-5 seconds) - more frequent for more activity
      const interval = 2000 + Math.random() * 3000;

      const timer = setInterval(() => {
        // 50% chance to ping each interval - more frequent alerts
        if (Math.random() < 0.5) {
          setIsPinging(true);
          setTimeout(() => setIsPinging(false), 800);
        }
      }, interval);

      return timer;
    };

    const initialTimer = setTimeout(() => {
      // Initial ping
      if (Math.random() < 0.7) {
        setIsPinging(true);
        setTimeout(() => setIsPinging(false), 800);
      }
    }, initialDelay);

    const intervalTimer = setTimeout(() => {
      return startPinging();
    }, initialDelay + 500);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(intervalTimer);
    };
  }, []);

  // BOLD colors with MASSIVE glow - borders match the table color
  const colorStyles = {
    green: {
      base: 'bg-emerald-500 border-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.8),0_0_60px_rgba(16,185,129,0.5),0_0_100px_rgba(16,185,129,0.3)]',
      ping: 'bg-emerald-400 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,1),0_0_100px_rgba(16,185,129,0.7),0_0_150px_rgba(16,185,129,0.4)]',
    },
    yellow: {
      base: 'bg-amber-500 border-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.8),0_0_60px_rgba(245,158,11,0.5),0_0_100px_rgba(245,158,11,0.3)]',
      ping: 'bg-amber-400 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,1),0_0_100px_rgba(245,158,11,0.7),0_0_150px_rgba(245,158,11,0.4)]',
    },
    blue: {
      base: 'bg-sky-500 border-sky-600 shadow-[0_0_30px_rgba(14,165,233,0.8),0_0_60px_rgba(14,165,233,0.5),0_0_100px_rgba(14,165,233,0.3)]',
      ping: 'bg-sky-400 border-sky-500 shadow-[0_0_50px_rgba(14,165,233,1),0_0_100px_rgba(14,165,233,0.7),0_0_150px_rgba(14,165,233,0.4)]',
    },
    red: {
      base: 'bg-red-500 border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.8),0_0_60px_rgba(239,68,68,0.5),0_0_100px_rgba(239,68,68,0.3)]',
      ping: 'bg-red-400 border-red-500 shadow-[0_0_50px_rgba(239,68,68,1),0_0_100px_rgba(239,68,68,0.7),0_0_150px_rgba(239,68,68,0.4)]',
    },
    orange: {
      base: 'bg-orange-500 border-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.8),0_0_60px_rgba(249,115,22,0.5),0_0_100px_rgba(249,115,22,0.3)]',
      ping: 'bg-orange-400 border-orange-500 shadow-[0_0_50px_rgba(249,115,22,1),0_0_100px_rgba(249,115,22,0.7),0_0_150px_rgba(249,115,22,0.4)]',
    },
  };

  const shapeStyles = {
    round: 'rounded-full',
    square: 'rounded-md',
    rectangle: 'rounded-lg',
  };

  return (
    <div
      className={`absolute border-4 transition-all duration-300 ease-out ${className} ${shapeStyles[shape]} ${
        isPinging ? colorStyles[color].ping : colorStyles[color].base
      }`}
      style={{
        transform: isPinging ? 'scale(1.25)' : 'scale(1)',
      }}
    />
  );
};

const Hero = () => {
  const [visibleCards, setVisibleCards] = useState([]);

  useEffect(() => {
    // Stagger the card animations
    const timers = [
      setTimeout(() => setVisibleCards(prev => [...prev, 0]), 300),
      setTimeout(() => setVisibleCards(prev => [...prev, 1]), 500),
      setTimeout(() => setVisibleCards(prev => [...prev, 2]), 700),
      setTimeout(() => setVisibleCards(prev => [...prev, 3]), 900),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Floorplan-style background - hidden on mobile */}
      <div className="absolute inset-0 hidden md:block">
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #d1d5db 1px, transparent 1px),
              linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        ></div>

        {/* Floorplan tables - Left side - bigger and bolder */}
        <Table className="top-[12%] left-[4%] w-20 h-20" color="green" shape="round" />
        <Table className="top-[28%] left-[10%] w-24 h-14" color="orange" shape="rectangle" />
        <Table className="top-[45%] left-[2%] w-18 h-18" color="blue" shape="square" />
        <Table className="top-[60%] left-[8%] w-16 h-16" color="red" shape="round" />
        <Table className="top-[75%] left-[3%] w-28 h-12" color="green" shape="rectangle" />
        <Table className="top-[88%] left-[12%] w-18 h-18" color="yellow" shape="square" />

        {/* Floorplan tables - Right side - bigger and bolder */}
        <Table className="top-[10%] right-[6%] w-24 h-14" color="red" shape="rectangle" />
        <Table className="top-[26%] right-[2%] w-18 h-18" color="green" shape="round" />
        <Table className="top-[44%] right-[10%] w-16 h-16" color="orange" shape="square" />
        <Table className="top-[60%] right-[4%] w-20 h-20" color="yellow" shape="round" />
        <Table className="top-[76%] right-[8%] w-22 h-12" color="blue" shape="rectangle" />
        <Table className="top-[90%] right-[3%] w-18 h-18" color="red" shape="square" />

        {/* Floorplan tables - Top edge */}
        <Table className="top-[4%] left-[22%] w-16 h-16" color="blue" shape="round" />
        <Table className="top-[6%] right-[24%] w-20 h-12" color="orange" shape="rectangle" />

        {/* Floorplan tables - Bottom edge */}
        <Table className="bottom-[6%] left-[24%] w-18 h-18" color="yellow" shape="square" />
        <Table className="bottom-[4%] right-[22%] w-20 h-20" color="green" shape="round" />

        {/* Center fade - lighter so tables pop more */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/50 to-white/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-12 lg:pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e3a5f] via-[#152a45] to-[#0f1f33] backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.4)] px-8 py-10 sm:px-12 sm:py-14 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-5 text-xs sm:text-sm font-semibold uppercase tracking-wide text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              Built for UK Hospitality Leaders
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-5">
              <span className="text-white">
                Catch Problems
              </span>{' '}
              Before They Become{' '}
              <span className="text-sky-400">1 Star Reviews</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-blue-100/80 mb-6 max-w-3xl mx-auto leading-relaxed">
              Real-time guest feedback, QR-powered surveys, and instant staff alerts so restaurants, pubs, and hotels can resolve issues before guests reach TripAdvisor or Google.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-3">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-[#152a45] bg-white rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                See Pricing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                Book a Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>

            {/* Microcopy */}
            <p className="text-sm text-blue-200/60 mb-8">
              No credit card required • Go live in 5 minutes • Loved by UK hospitality teams
            </p>

            {/* Cards inside the tile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1 - Real-time Alert */}
              <div
                className={`transform transition-all duration-700 ease-out ${
                  visibleCards.includes(0)
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                }`}
              >
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Real-Time Alert</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">Table 12 needs help</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Just now</span>
                  </div>
                </div>
              </div>

              {/* Card 2 - Feedback Form */}
              <div
                className={`transform transition-all duration-700 ease-out ${
                  visibleCards.includes(1)
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                }`}
              >
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#4E74FF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#4E74FF]" />
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Quick Feedback</p>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">How was your experience?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3 - Analytics */}
              <div
                className={`transform transition-all duration-700 ease-out ${
                  visibleCards.includes(2)
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                }`}
              >
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#4E74FF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#4E74FF]" />
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">This Week</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Avg Rating</span>
                      <span className="text-sm sm:text-base font-bold text-[#4E74FF]">4.7</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-[#4E74FF] h-2 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4 - Review Boost */}
              <div
                className={`transform transition-all duration-700 ease-out ${
                  visibleCards.includes(3)
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                }`}
              >
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Review Boost</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">+47 Google Reviews</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">This month from happy guests</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
