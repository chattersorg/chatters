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
    <section className="relative bg-gradient-to-b from-slate-100 to-slate-50 pt-20 pb-64 lg:pt-28 lg:pb-72">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
          Built for UK Hospitality
        </p>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-6">
          <span className="text-[#6D8DFF]">Catch Problems</span> Before They Become{' '}
          <span className="text-[#6D8DFF]">1-Star Reviews</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Real-time guest feedback that alerts your team instantly — so you can fix issues while customers are still at the table.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <Link
            to="/try"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#4E74FF] rounded-full hover:bg-[#2F5CFF] transition-all duration-200 shadow-lg hover:shadow-xl group"
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
        <p className="text-sm text-gray-500 mb-16">
          No credit card required • Go live in 5 minutes
        </p>
      </div>

      {/* Floating UI Cards - positioned at bottom, overlapping into next section */}
      <div className="absolute left-0 right-0 bottom-0 translate-y-1/2 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Card 1 - Real-time Alert */}
            <div
              className={`transform transition-all duration-700 ease-out ${
                visibleCards.includes(0)
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-16 opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Real-Time Alert</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">Table 12 needs help</p>
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
              className={`transform transition-all duration-700 ease-out lg:-mt-4 ${
                visibleCards.includes(1)
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-16 opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#4E74FF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#4E74FF]" />
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
                      className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3 - Analytics */}
            <div
              className={`transform transition-all duration-700 ease-out lg:-mt-2 ${
                visibleCards.includes(2)
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-16 opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#4E74FF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#4E74FF]" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">This Week</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Avg Rating</span>
                    <span className="text-sm font-bold text-[#4E74FF]">4.7</span>
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
                  : 'translate-y-16 opacity-0'
              }`}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Review Boost</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">+47 Google Reviews</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">This month from happy guests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative dotted line connector */}
        <svg
          className="absolute left-1/2 -top-20 -translate-x-1/2 w-[500px] h-16 opacity-20 hidden lg:block"
          viewBox="0 0 500 60"
          fill="none"
        >
          <path
            d="M30 50 Q125 10 250 35 Q375 60 470 15"
            stroke="#4E74FF"
            strokeWidth="2"
            strokeDasharray="8 8"
            fill="none"
          />
          <polygon points="470,15 458,22 462,28" fill="#4E74FF" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
