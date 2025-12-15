import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, MessageSquare, TrendingUp, Star } from 'lucide-react';

// Table component with ping animation
const Table = ({ className, color, shape }) => {
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    // Random initial delay between 0-5 seconds
    const initialDelay = Math.random() * 5000;

    const startPinging = () => {
      // Random interval between pings (3-8 seconds)
      const interval = 3000 + Math.random() * 5000;

      const timer = setInterval(() => {
        // 30% chance to ping each interval
        if (Math.random() < 0.3) {
          setIsPinging(true);
          setTimeout(() => setIsPinging(false), 600);
        }
      }, interval);

      return timer;
    };

    const initialTimer = setTimeout(() => {
      // Initial ping
      if (Math.random() < 0.5) {
        setIsPinging(true);
        setTimeout(() => setIsPinging(false), 600);
      }
    }, initialDelay);

    const intervalTimer = setTimeout(() => {
      return startPinging();
    }, initialDelay + 1000);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(intervalTimer);
    };
  }, []);

  const colorStyles = {
    green: {
      base: 'bg-emerald-500/40 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]',
      ping: 'bg-emerald-500/70 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.8)]',
    },
    yellow: {
      base: 'bg-amber-500/40 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]',
      ping: 'bg-amber-500/70 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.8)]',
    },
    blue: {
      base: 'bg-[#4E74FF]/40 border-[#4E74FF] shadow-[0_0_30px_rgba(78,116,255,0.5)]',
      ping: 'bg-[#4E74FF]/70 border-[#6D8DFF] shadow-[0_0_50px_rgba(78,116,255,0.8)]',
    },
    red: {
      base: 'bg-red-500/40 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]',
      ping: 'bg-red-500/70 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.8)]',
    },
  };

  const shapeStyles = {
    round: 'rounded-full',
    square: 'rounded-md',
    rectangle: 'rounded-lg',
  };

  return (
    <div
      className={`absolute border-[3px] transition-all duration-300 ${className} ${shapeStyles[shape]} ${
        isPinging ? colorStyles[color].ping : colorStyles[color].base
      }`}
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
    <section className="relative min-h-screen overflow-hidden">
      {/* Floorplan-style background */}
      <div className="absolute inset-0 bg-white">
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        ></div>

        {/* Floorplan tables - Left side */}
        <Table className="top-[15%] left-[5%] w-16 h-16" color="green" shape="round" />
        <Table className="top-[25%] left-[12%] w-20 h-12" color="yellow" shape="rectangle" />
        <Table className="top-[40%] left-[3%] w-14 h-14" color="blue" shape="square" />
        <Table className="top-[55%] left-[10%] w-12 h-12" color="red" shape="round" />
        <Table className="top-[70%] left-[4%] w-24 h-10" color="green" shape="rectangle" />
        <Table className="top-[82%] left-[14%] w-16 h-16" color="yellow" shape="square" />

        {/* Floorplan tables - Right side */}
        <Table className="top-[12%] right-[8%] w-20 h-12" color="red" shape="rectangle" />
        <Table className="top-[28%] right-[3%] w-14 h-14" color="green" shape="round" />
        <Table className="top-[42%] right-[12%] w-12 h-12" color="blue" shape="square" />
        <Table className="top-[58%] right-[5%] w-16 h-16" color="yellow" shape="round" />
        <Table className="top-[72%] right-[10%] w-18 h-10" color="green" shape="rectangle" />
        <Table className="top-[85%] right-[4%] w-14 h-14" color="red" shape="square" />

        {/* Floorplan tables - Top edge */}
        <Table className="top-[5%] left-[25%] w-12 h-12" color="blue" shape="round" />
        <Table className="top-[8%] right-[28%] w-16 h-10" color="green" shape="rectangle" />

        {/* Floorplan tables - Bottom edge */}
        <Table className="bottom-[8%] left-[28%] w-14 h-14" color="yellow" shape="square" />
        <Table className="bottom-[5%] right-[25%] w-16 h-16" color="green" shape="round" />

        {/* Center fade for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-white/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 lg:pt-28 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
            Built for UK Hospitality
          </p>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-6">
            <span className="text-[#2F5CFF]">Catch Problems</span> Before They Become{' '}
            <span className="text-[#2F5CFF]">1-Star Reviews</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Real-time guest feedback that alerts your team instantly so you can fix issues while customers are still at the table.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-3">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#4E74FF] rounded-lg hover:bg-[#2F5CFF] transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              Pricing
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
            >
              Book Demo
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Microcopy */}
          <p className="text-sm text-gray-500 mb-10">
            No credit card required • Go live in 5 minutes
          </p>
        </div>

        {/* Floating UI Cards - closer to text, bigger, cut off at bottom */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {/* Card 1 - Real-time Alert */}
            <div
              className={`transform transition-all duration-700 ease-out ${
                visibleCards.includes(0)
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-16 opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="w-7 h-7 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Real-Time Alert</p>
                    <p className="text-lg font-semibold text-gray-900">Table 12 needs help</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">Just now</span>
                </div>
              </div>
            </div>

            {/* Card 2 - Feedback Form */}
            <div
              className={`transform transition-all duration-700 ease-out lg:mt-8 ${
                visibleCards.includes(1)
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-16 opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#4E74FF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-7 h-7 text-[#4E74FF]" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Quick Feedback</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">How was your experience?</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-7 h-7 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3 - Analytics */}
            <div
              className={`transform transition-all duration-700 ease-out lg:mt-4 ${
                visibleCards.includes(2)
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-16 opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#4E74FF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-7 h-7 text-[#4E74FF]" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">This Week</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Avg Rating</span>
                    <span className="text-lg font-bold text-[#4E74FF]">4.7</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-[#4E74FF] h-3 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 - Review Boost */}
            <div
              className={`transform transition-all duration-700 ease-out lg:mt-12 ${
                visibleCards.includes(3)
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-16 opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Review Boost</p>
                    <p className="text-lg font-semibold text-gray-900">+47 Google Reviews</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">This month from happy guests</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
