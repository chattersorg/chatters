import React, { useState, useEffect } from 'react';
import { User, DoorOpen, Star, AlertTriangle, Clock, X, MessageSquareOff } from 'lucide-react';

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
    { id: 0, label: 'Guest frustrated', emoji: '😤' },
    { id: 1, label: 'Stays silent', emoji: '🤐' },
    { id: 2, label: 'Leaves quietly', emoji: '🚶' },
    { id: 3, label: 'Posts 1-star review', emoji: '⭐' },
    { id: 4, label: 'Manager sees too late', emoji: '😱' },
  ];

  // Visual components for each step
  const StepVisual = ({ index }) => {
    const isActive = activeStep === index;
    const isPast = activeStep > index;

    switch (index) {
      case 0: // Guest frustrated at table
        return (
          <div className={`relative transition-all duration-500 ${isActive ? 'scale-110' : isPast ? 'scale-100 opacity-60' : 'scale-90 opacity-40'}`}>
            {/* Table */}
            <div className="w-14 h-8 bg-slate-700 rounded-lg border-2 border-slate-600 mx-auto"></div>
            {/* Person at table */}
            <div className={`absolute -top-7 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isActive ? 'bg-red-500' : 'bg-slate-600'
            }`}>
              <User className="w-5 h-5 text-white" />
            </div>
            {/* Frustration indicator */}
            {isActive && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-xl animate-bounce">
                😤
              </div>
            )}
            {/* Food on table */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-slate-500 rounded"></div>
          </div>
        );

      case 1: // Stays silent
        return (
          <div className={`relative transition-all duration-500 ${isActive ? 'scale-110' : isPast ? 'scale-100 opacity-60' : 'scale-90 opacity-40'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 mx-auto ${
              isActive ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-700/50 border-slate-600'
            }`}>
              <MessageSquareOff className={`w-6 h-6 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            {isActive && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl">
                🤐
              </div>
            )}
          </div>
        );

      case 2: // Leaves quietly
        return (
          <div className={`relative transition-all duration-500 ${isActive ? 'scale-110' : isPast ? 'scale-100 opacity-60' : 'scale-90 opacity-40'}`}>
            {/* Door */}
            <div className={`w-10 h-14 rounded-t-lg border-2 flex items-center justify-center transition-colors duration-300 mx-auto ${
              isActive ? 'bg-slate-600 border-amber-500' : 'bg-slate-700 border-slate-600'
            }`}>
              <DoorOpen className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            {/* Person leaving */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center animate-[slideRight_1s_ease-in-out_infinite]">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        );

      case 3: // Posts 1-star review
        return (
          <div className={`relative transition-all duration-500 ${isActive ? 'scale-110' : isPast ? 'scale-100 opacity-60' : 'scale-90 opacity-40'}`}>
            {/* Phone */}
            <div className={`w-11 h-[70px] rounded-xl border-2 p-1 transition-colors duration-300 mx-auto ${
              isActive ? 'bg-slate-800 border-red-500' : 'bg-slate-700 border-slate-600'
            }`}>
              <div className="w-full h-full bg-slate-900 rounded-lg p-1 flex flex-col">
                <div className="text-[5px] text-slate-400 mb-0.5">Review</div>
                {/* Stars */}
                <div className="flex gap-0.5 mb-1 justify-center">
                  <Star className={`w-2 h-2 ${isActive ? 'fill-red-500 text-red-500' : 'fill-slate-600 text-slate-600'}`} />
                  <Star className="w-2 h-2 text-slate-600" />
                  <Star className="w-2 h-2 text-slate-600" />
                  <Star className="w-2 h-2 text-slate-600" />
                  <Star className="w-2 h-2 text-slate-600" />
                </div>
                {/* Review text lines */}
                <div className="space-y-0.5 flex-1">
                  <div className="h-0.5 bg-slate-700 rounded w-full"></div>
                  <div className="h-0.5 bg-slate-700 rounded w-3/4"></div>
                </div>
                {/* Post button */}
                {isActive && (
                  <div className="bg-red-500 rounded text-[4px] text-white text-center py-0.5 mt-auto">
                    Posted
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4: // Manager sees too late
        return (
          <div className={`relative transition-all duration-500 ${isActive ? 'scale-110' : isPast ? 'scale-100 opacity-60' : 'scale-90 opacity-40'}`}>
            {/* Manager alert */}
            <div className={`w-14 h-10 rounded-lg border-2 flex items-center justify-center transition-colors duration-300 mx-auto ${
              isActive ? 'bg-red-900/50 border-red-500' : 'bg-slate-700 border-slate-600'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${isActive ? 'text-red-400' : 'text-slate-500'}`} />
            </div>
            {/* Too late indicator */}
            {isActive && (
              <>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  Too late!
                </div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-lg">
                  😱
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Combined visual + indicators in one aligned grid */}
      <div className="flex items-end justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center relative">
            {/* Visual above */}
            <div className="h-24 flex items-end justify-center mb-4">
              <StepVisual index={index} />
            </div>

            {/* Connector arrow to next step */}
            {index < steps.length - 1 && (
              <div className="absolute top-12 -right-4 sm:-right-6 lg:-right-8 w-8 sm:w-12 lg:w-16 flex items-center z-10">
                <div className={`flex-1 h-0.5 transition-colors duration-500 ${
                  activeStep > index ? 'bg-red-500' : 'bg-slate-700'
                }`}></div>
                <div className={`w-0 h-0 border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent transition-colors duration-500 ${
                  activeStep > index ? 'border-l-red-500' : 'border-l-slate-700'
                }`} style={{ borderLeftWidth: '6px' }}></div>
              </div>
            )}

            {/* Step indicator dot */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                activeStep === index
                  ? 'bg-red-500 scale-110 ring-4 ring-red-500/30'
                  : activeStep > index
                  ? 'bg-red-500/50'
                  : 'bg-slate-700'
              }`}
            >
              <span className="text-lg">{step.emoji}</span>
            </div>

            {/* Label */}
            <p
              className={`text-xs mt-2 transition-colors duration-300 text-center max-w-[80px] ${
                activeStep === index ? 'text-red-400 font-semibold' : 'text-slate-500'
              }`}
            >
              {step.label}
            </p>
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
          50% { transform: translateX(8px) translateY(-50%); }
        }
      `}</style>
    </section>
  );
};

export default Problem;
