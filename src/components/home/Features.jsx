import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle, CheckCircle, Clock, MessageSquare, Bell, MapPin, ThumbsUp, ExternalLink } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// MOCKUP 1: Live Feedback Dashboard
// ─────────────────────────────────────────────────────────────
const LiveDashboardMockup = () => {
  const [activeCards, setActiveCards] = useState([0, 1, 2]);
  const [pulsingCard, setPulsingCard] = useState(null);

  // Simulate new feedback arriving
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsingCard(0);
      setTimeout(() => setPulsingCard(null), 1000);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const feedbackItems = [
    { table: 'Table 8', rating: 2, time: 'Just now', comment: 'Long wait for mains', urgent: true },
    { table: 'Table 3', rating: 4, time: '2 min ago', comment: 'Great starter', urgent: false },
    { table: 'Table 12', rating: 5, time: '5 min ago', comment: 'Excellent service!', urgent: false },
  ];

  const getRatingColor = (rating) => {
    if (rating <= 2) return 'bg-red-500';
    if (rating <= 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getRatingBg = (rating) => {
    if (rating <= 2) return 'bg-red-50 border-red-200';
    if (rating <= 3) return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="bg-slate-900 rounded-lg p-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-slate-300">Live Feed</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Bell className="w-3 h-3" />
          <span>3 new</span>
        </div>
      </div>

      {/* Feedback Cards */}
      <div className="space-y-2">
        {feedbackItems.map((item, index) => (
          <div
            key={index}
            className={`rounded-lg p-2.5 border transition-all duration-300 ${getRatingBg(item.rating)} ${
              pulsingCard === index ? 'ring-2 ring-blue-400 scale-[1.02]' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-xs text-slate-800">{item.table}</span>
                  {item.urgent && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 truncate">{item.comment}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className={`${getRatingColor(item.rating)} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                  {item.rating}/5
                </div>
                <span className="text-[10px] text-slate-500">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MOCKUP 2: Staff Kiosk Mode
// ─────────────────────────────────────────────────────────────
const KioskModeMockup = () => {
  const [resolvedTable, setResolvedTable] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setResolvedTable(2);
      setTimeout(() => setResolvedTable(null), 2000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const tables = [
    { id: 1, number: 8, status: 'urgent', x: 15, y: 20 },
    { id: 2, number: 3, status: 'attention', x: 45, y: 35 },
    { id: 3, number: 12, status: 'good', x: 75, y: 25 },
    { id: 4, number: 5, status: 'neutral', x: 25, y: 60 },
    { id: 5, number: 14, status: 'good', x: 60, y: 65 },
  ];

  const getTableColor = (status) => {
    switch (status) {
      case 'urgent': return 'bg-red-500 ring-4 ring-red-300 animate-pulse';
      case 'attention': return 'bg-amber-500';
      case 'good': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  const priorityQueue = [
    { table: 8, rating: 2, status: 'urgent', time: '2m ago' },
    { table: 3, rating: 3, status: 'attention', time: '5m ago' },
    { table: 12, rating: 5, status: 'good', time: '8m ago' },
  ];

  return (
    <div className="bg-slate-900 rounded-lg p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white">Kiosk Mode</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="text-[10px] text-slate-400">1 urgent</span>
        </div>
      </div>

      {/* Floor Plan */}
      <div className="relative bg-slate-800 rounded-lg flex-1 min-h-[120px] mb-2">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>

        {/* Tables */}
        {tables.map((table) => (
          <div
            key={table.id}
            className={`absolute w-7 h-7 rounded-lg ${getTableColor(table.status)} flex items-center justify-center text-white text-[10px] font-bold transition-all duration-300 ${
              resolvedTable === table.id ? 'scale-110 ring-4 ring-emerald-300' : ''
            }`}
            style={{ left: `${table.x}%`, top: `${table.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {table.number}
          </div>
        ))}
      </div>

      {/* Priority Queue */}
      <div className="space-y-1.5">
        {priorityQueue.slice(0, 2).map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-1.5 rounded ${
              item.status === 'urgent' ? 'bg-red-900/50' : 'bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-white">T{item.table}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                item.status === 'urgent' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {item.rating}★
              </span>
            </div>
            <button className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5">
              <CheckCircle className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MOCKUP 3: Review Boosting
// ─────────────────────────────────────────────────────────────
const ReviewBoostMockup = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 rounded-lg p-3 h-full flex flex-col">
      {/* Phone Frame */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[140px] bg-white rounded-2xl p-3 shadow-xl">
          {step === 0 && (
            <div className="text-center animate-fadeIn">
              <p className="text-[10px] text-slate-600 mb-2">How was your experience?</p>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= 5 ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <p className="text-[10px] font-semibold text-slate-800">Amazing!</p>
            </div>
          )}

          {step === 1 && (
            <div className="text-center animate-fadeIn">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-[10px] font-semibold text-slate-800 mb-1">Thanks for the feedback!</p>
              <p className="text-[9px] text-slate-500">Would you share your experience?</p>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn">
              <p className="text-[10px] text-slate-600 text-center mb-2">Leave a review on:</p>
              <div className="space-y-1.5">
                <button className="w-full flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[10px] font-medium text-slate-700">Google</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                </button>
                <button className="w-full flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="12" fill="#34E0A1"/>
                    <path d="M19.4 9.6l1.44-1.57h-3.2c-1.6-1.1-3.53-1.73-5.62-1.73s-4.02.64-5.62 1.73H3.16l1.44 1.57c-.88.8-1.44 1.97-1.44 3.26 0 2.43 1.97 4.41 4.41 4.41 1.16 0 2.21-.45 3-1.17l1.41 1.54 1.41-1.54c.79.73 1.84 1.17 3 1.17 2.43 0 4.41-1.97 4.41-4.41 0-1.29-.56-2.45-1.44-3.26zM7.54 15.87c-1.65 0-2.98-1.34-2.98-2.98s1.34-2.98 2.98-2.98 2.98 1.34 2.98 2.98-1.34 2.98-2.98 2.98zm4.41-3.07c0-1.96-1.43-3.65-3.31-4.37 1.02-.43 2.14-.66 3.31-.66s2.29.24 3.31.66c-1.88.72-3.31 2.4-3.31 4.37zm4.46 3.07c-1.65 0-2.98-1.34-2.98-2.98s1.34-2.98 2.98-2.98 2.98 1.34 2.98 2.98-1.34 2.98-2.98 2.98zm0-4.53c-.86 0-1.56.7-1.56 1.56s.7 1.56 1.56 1.56 1.56-.7 1.56-1.56-.7-1.56-1.56-1.56zm-8.87 1.56c0 .86-.7 1.56-1.56 1.56s-1.56-.7-1.56-1.56.7-1.56 1.56-1.56 1.56.7 1.56 1.56z" fill="#000"/>
                  </svg>
                  <span className="text-[10px] font-medium text-slate-700">TripAdvisor</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-2 pt-2 border-t border-slate-700">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">This month</span>
          <span className="text-emerald-400 font-semibold">+47 reviews</span>
        </div>
        <div className="mt-1.5 bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78%' }}></div>
        </div>
        <p className="text-[9px] text-slate-500 mt-1">78% of 5-star guests left reviews</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN FEATURES COMPONENT
// ─────────────────────────────────────────────────────────────
const features = [
  {
    component: LiveDashboardMockup,
    title: 'Live Feedback Dashboard',
    description: 'See every rating as it happens. Colour-coded alerts highlight urgent issues. Spot patterns by table, time, or staff member.',
  },
  {
    component: KioskModeMockup,
    title: 'Staff Kiosk Mode',
    description: "A real-time priority queue your team can't miss. Urgent feedback first. Interactive floor plan. One-tap acknowledgement & resolution logging.",
  },
  {
    component: ReviewBoostMockup,
    title: 'Turn Happy Guests Into Reviews',
    description: 'Guests who rate highly are prompted to leave Google or TripAdvisor reviews automatically.',
  },
];

const Features = () => {
  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Powerful Tools Designed for Hospitality
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* Mockup */}
              <div className="h-[280px] p-4 bg-slate-100">
                <feature.component />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default Features;
