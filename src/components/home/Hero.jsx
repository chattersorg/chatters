import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, MessageSquare, TrendingUp, Star } from 'lucide-react';

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
    <section className="relative bg-gradient-to-b from-gray-100 to-gray-50 pt-20 pb-32 lg:pt-28 lg:pb-40 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <p className="text-sm font-semibold uppercase tracking-wide text-[#41C74E] mb-4">
          Built for UK Hospitality
        </p>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-6">
          <span className="text-gray-400">Catch Problems</span> Before They Become{' '}
          <span className="text-gray-400">1-Star Reviews</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Real-time guest feedback that alerts your team instantly — so you can fix issues while customers are still at the table.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <Link
            to="/try"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#41C74E] rounded-full hover:bg-[#38b043] transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            Start Free Trial
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 hover:text-gray-900 transition-all duration-200 group"
          >
            Book Demo
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Microcopy */}
        <p className="text-sm text-gray-500">
          No credit card required • Go live in 5 minutes
        </p>
      </div>

      {/* Floating UI Cards */}
      <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none">
        {/* Card 1 - Real-time Alert (Bottom Left) */}
        <div
          className={`absolute left-[5%] lg:left-[10%] bottom-[-20px] transform transition-all duration-700 ease-out ${
            visibleCards.includes(0)
              ? 'translate-y-0 opacity-100'
              : 'translate-y-16 opacity-0'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 w-64">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Real-Time Alert</p>
                <p className="text-sm font-semibold text-gray-900">Table 12 needs help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Just now</span>
            </div>
          </div>
        </div>

        {/* Card 2 - Feedback Form (Left of Center) */}
        <div
          className={`absolute left-[20%] lg:left-[25%] bottom-[-60px] transform transition-all duration-700 ease-out ${
            visibleCards.includes(1)
              ? 'translate-y-0 opacity-100'
              : 'translate-y-16 opacity-0'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 w-56">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#41C74E]/10 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#41C74E]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Quick Feedback</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3">How was your experience?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Card 3 - Analytics (Right of Center) */}
        <div
          className={`absolute right-[20%] lg:right-[25%] bottom-[-40px] transform transition-all duration-700 ease-out ${
            visibleCards.includes(2)
              ? 'translate-y-0 opacity-100'
              : 'translate-y-16 opacity-0'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 w-60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900">This Week</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Avg Rating</span>
                <span className="text-sm font-bold text-[#41C74E]">4.7</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-[#41C74E] h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4 - Review Boost (Bottom Right) */}
        <div
          className={`absolute right-[5%] lg:right-[10%] bottom-[-10px] transform transition-all duration-700 ease-out ${
            visibleCards.includes(3)
              ? 'translate-y-0 opacity-100'
              : 'translate-y-16 opacity-0'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 w-64">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Review Boost</p>
                <p className="text-sm font-semibold text-gray-900">+47 Google Reviews</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">This month from happy guests</p>
          </div>
        </div>

        {/* Decorative dotted line connector (like Workforce) */}
        <svg
          className="absolute left-1/2 bottom-32 -translate-x-1/2 w-96 h-24 opacity-30 hidden lg:block"
          viewBox="0 0 400 100"
          fill="none"
        >
          <path
            d="M50 80 Q100 20 200 50 Q300 80 350 20"
            stroke="#41C74E"
            strokeWidth="2"
            strokeDasharray="6 6"
            fill="none"
          />
          <polygon points="350,20 345,30 355,28" fill="#41C74E" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
