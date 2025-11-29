import React, { useState, useEffect } from 'react';
import { User, DoorOpen, Star, AlertTriangle, Clock, X } from 'lucide-react';

// Animated guest journey showing the problem
const GuestJourneyGraphic = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { id: 0, label: 'Guest frustrated', delay: 0 },
    { id: 1, label: 'Stays silent', delay: 1 },
    { id: 2, label: 'Leaves quietly', delay: 2 },
    { id: 3, label: 'Posts 1-star review', delay: 3 },
    { id: 4, label: 'Manager sees too late', delay: 4 },
  ];

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Main visual area */}
      <div className="relative h-48 mb-8">
        {/* Restaurant scene background */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Table representation */}
          <div className="relative">
            {/* The journey path */}
            <svg className="absolute inset-0 w-full h-full" style={{ width: '600px', height: '180px', left: '-250px', top: '-40px' }}>
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              {/* Dotted path line */}
              <path
                d="M 50 90 Q 150 90 200 70 Q 250 50 350 50 Q 450 50 500 90 Q 550 130 580 130"
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="3"
                strokeDasharray="8 8"
                className="opacity-50"
              />
            </svg>

            {/* Step 1: At table - frustrated */}
            <div
              className={`absolute transition-all duration-500 ${
                activeStep >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{ left: '-200px', top: '20px' }}
            >
              <div className={`relative ${activeStep === 0 ? 'animate-pulse' : ''}`}>
                {/* Table */}
                <div className="w-16 h-10 bg-slate-700 rounded-lg border-2 border-slate-600"></div>
                {/* Person at table */}
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  activeStep === 0 ? 'bg-red-500' : 'bg-slate-600'
                }`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                {/* Frustration indicator */}
                {activeStep === 0 && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                    😤
                  </div>
                )}
                {/* Food on table */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-slate-500 rounded"></div>
              </div>
            </div>

            {/* Step 2: Silent - not complaining */}
            <div
              className={`absolute transition-all duration-500 ${
                activeStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{ left: '-80px', top: '-10px' }}
            >
              <div className={`relative ${activeStep === 1 ? 'animate-pulse' : ''}`}>
                {/* Thought bubble showing they're not speaking up */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  activeStep === 1 ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-700/50 border-slate-600'
                }`}>
                  <div className="text-center">
                    <X className={`w-5 h-5 mx-auto ${activeStep === 1 ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="text-[8px] text-slate-400">silent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Walking out */}
            <div
              className={`absolute transition-all duration-500 ${
                activeStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{ left: '60px', top: '-20px' }}
            >
              <div className={`relative ${activeStep === 2 ? '' : ''}`}>
                {/* Door */}
                <div className={`w-12 h-16 rounded-t-lg border-2 flex items-center justify-center transition-colors duration-300 ${
                  activeStep === 2 ? 'bg-slate-600 border-amber-500' : 'bg-slate-700 border-slate-600'
                }`}>
                  <DoorOpen className={`w-6 h-6 ${activeStep === 2 ? 'text-amber-400' : 'text-slate-500'}`} />
                </div>
                {/* Person leaving */}
                {activeStep === 2 && (
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-[slideRight_1s_ease-in-out_infinite]">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Phone with 1-star review */}
            <div
              className={`absolute transition-all duration-500 ${
                activeStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{ left: '180px', top: '10px' }}
            >
              <div className={`relative ${activeStep === 3 ? 'animate-pulse' : ''}`}>
                {/* Phone */}
                <div className={`w-14 h-24 rounded-xl border-2 p-1 transition-colors duration-300 ${
                  activeStep === 3 ? 'bg-slate-800 border-red-500' : 'bg-slate-700 border-slate-600'
                }`}>
                  {/* Screen content */}
                  <div className="w-full h-full bg-slate-900 rounded-lg p-1.5 flex flex-col">
                    <div className="text-[6px] text-slate-400 mb-1">Review</div>
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-1">
                      <Star className={`w-2.5 h-2.5 ${activeStep === 3 ? 'fill-red-500 text-red-500' : 'fill-slate-600 text-slate-600'}`} />
                      <Star className="w-2.5 h-2.5 text-slate-600" />
                      <Star className="w-2.5 h-2.5 text-slate-600" />
                      <Star className="w-2.5 h-2.5 text-slate-600" />
                      <Star className="w-2.5 h-2.5 text-slate-600" />
                    </div>
                    {/* Review text lines */}
                    <div className="space-y-0.5">
                      <div className="h-1 bg-slate-700 rounded w-full"></div>
                      <div className="h-1 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-1 bg-slate-700 rounded w-1/2"></div>
                    </div>
                    {/* Post button */}
                    {activeStep === 3 && (
                      <div className="mt-auto bg-red-500 rounded text-[5px] text-white text-center py-0.5">
                        Posted
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5: Manager seeing too late */}
            <div
              className={`absolute transition-all duration-500 ${
                activeStep >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{ left: '300px', top: '30px' }}
            >
              <div className={`relative ${activeStep === 4 ? 'animate-pulse' : ''}`}>
                {/* Manager with laptop */}
                <div className={`w-16 h-12 rounded-lg border-2 flex items-center justify-center transition-colors duration-300 ${
                  activeStep === 4 ? 'bg-red-900/50 border-red-500' : 'bg-slate-700 border-slate-600'
                }`}>
                  <div className="text-center">
                    <AlertTriangle className={`w-5 h-5 mx-auto ${activeStep === 4 ? 'text-red-400' : 'text-slate-500'}`} />
                  </div>
                </div>
                {/* Too late indicator */}
                {activeStep === 4 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Too late!
                  </div>
                )}
                {/* Reaction */}
                {activeStep === 4 && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-lg">
                    😱
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-red-500 scale-110'
                    : activeStep > index
                    ? 'bg-red-500/50'
                    : 'bg-slate-700'
                }`}
              >
                <span className="text-lg">
                  {index === 0 && '😤'}
                  {index === 1 && '🤐'}
                  {index === 2 && '🚶'}
                  {index === 3 && '⭐'}
                  {index === 4 && '😱'}
                </span>
              </div>
              <p
                className={`text-xs mt-2 transition-colors duration-300 text-center max-w-[70px] ${
                  activeStep === index ? 'text-red-400 font-semibold' : 'text-slate-500'
                }`}
              >
                {step.label}
              </p>
            </div>
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="hidden sm:block w-8 lg:w-12 h-0.5 mx-1 lg:mx-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    activeStep > index ? 'bg-red-500' : 'bg-slate-700'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Impact message */}
      <div className="mt-8 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 ${
          activeStep === 4 ? 'bg-red-500/20 border border-red-500/50' : 'bg-slate-700/50'
        }`}>
          <AlertTriangle className={`w-4 h-4 ${activeStep === 4 ? 'text-red-400' : 'text-slate-500'}`} />
          <span className={`text-sm ${activeStep === 4 ? 'text-red-400' : 'text-slate-400'}`}>
            This happens 68% of the time without real-time feedback
          </span>
        </div>
      </div>
    </div>
  );
};

const Problem = () => {
  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Section Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            The Silent Customer Problem in Hospitality
          </h2>

          {/* Body Text */}
          <div className="text-xl text-slate-300 space-y-6 mb-12">
            <p>
              <span className="text-white font-semibold">68% of unhappy customers won't complain to your staff.</span>
              <br />
              They'll just leave — and tell everyone else online.
            </p>

            <p>
              A single 1-star review can take dozens of positive reviews to balance out.
            </p>

            <p>
              Chatters gives you real-time visibility so you can fix issues before the customer walks out — and before the review goes public.
            </p>
          </div>

          {/* Visual */}
          <div className="mt-12">
            <GuestJourneyGraphic />
          </div>
        </div>
      </div>

      {/* Custom animation keyframes */}
      <style jsx>{`
        @keyframes slideRight {
          0%, 100% { transform: translateX(0) translateY(-50%); }
          50% { transform: translateX(10px) translateY(-50%); }
        }
      `}</style>
    </section>
  );
};

export default Problem;
