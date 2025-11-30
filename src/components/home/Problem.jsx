import React, { useState, useEffect } from 'react';
import { User, DoorOpen, Star, AlertTriangle, Clock, MessageSquareOff, Frown, VolumeX, LogOut, Smartphone } from 'lucide-react';

// Animated guest journey showing the problem
const GuestJourneyGraphic = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        // When we reach step 5 (all lit), reset to 0 after a pause
        if (prev >= 4) {
          return 0;
        }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Check if a step should be lit (active or already passed)
  const isLit = (index) => index <= activeStep;

  const steps = [
    { id: 0, label: 'Guest frustrated', icon: Frown },
    { id: 1, label: 'Stays silent', icon: VolumeX },
    { id: 2, label: 'Leaves quietly', icon: LogOut },
    { id: 3, label: 'Posts 1-star review', icon: Smartphone },
    { id: 4, label: 'Manager sees too late', icon: AlertTriangle },
  ];

  // Icon for step indicator
  const StepIcon = ({ step, isActive, isLit }) => {
    const Icon = step.icon;
    return (
      <Icon className={`w-5 h-5 ${isLit ? 'text-white' : 'text-slate-400'}`} />
    );
  };

  // Visual components for each step
  const StepVisual = ({ index }) => {
    const isActive = activeStep === index;
    const stepIsLit = isLit(index);

    switch (index) {
      case 0: // Guest frustrated at table
        return (
          <div className={`relative transition-all duration-500 ${stepIsLit ? 'scale-100' : 'scale-90 opacity-40'}`}>
            {/* Table */}
            <div className="w-14 h-8 bg-slate-700 rounded-lg border-2 border-slate-600 mx-auto"></div>
            {/* Person at table */}
            <div className={`absolute -top-7 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 ${
              stepIsLit ? 'bg-red-500' : 'bg-slate-600'
            }`}>
              <User className="w-5 h-5 text-white" />
            </div>
            {/* Frustration indicator */}
            {stepIsLit && (
              <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center ${isActive ? 'animate-bounce' : ''}`}>
                <Frown className="w-4 h-4 text-white" />
              </div>
            )}
            {/* Food on table */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-slate-500 rounded"></div>
          </div>
        );

      case 1: // Stays silent
        return (
          <div className={`relative transition-all duration-500 ${stepIsLit ? 'scale-100' : 'scale-90 opacity-40'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 mx-auto ${
              stepIsLit ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-700/50 border-slate-600'
            }`}>
              <MessageSquareOff className={`w-6 h-6 ${stepIsLit ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
          </div>
        );

      case 2: // Leaves quietly
        return (
          <div className={`relative transition-all duration-500 ${stepIsLit ? 'scale-100' : 'scale-90 opacity-40'}`}>
            {/* Door */}
            <div className={`w-10 h-14 rounded-t-lg border-2 flex items-center justify-center transition-colors duration-300 mx-auto ${
              stepIsLit ? 'bg-slate-600 border-amber-500' : 'bg-slate-700 border-slate-600'
            }`}>
              <DoorOpen className={`w-5 h-5 ${stepIsLit ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            {/* Person leaving */}
            {stepIsLit && (
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center ${isActive ? 'animate-[slideRight_1s_ease-in-out_infinite]' : ''}`}>
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        );

      case 3: // Posts 1-star review
        return (
          <div className={`relative transition-all duration-500 ${stepIsLit ? 'scale-100' : 'scale-90 opacity-40'}`}>
            {/* Phone */}
            <div className={`w-11 h-[70px] rounded-xl border-2 p-1 transition-colors duration-300 mx-auto ${
              stepIsLit ? 'bg-slate-800 border-red-500' : 'bg-slate-700 border-slate-600'
            }`}>
              <div className="w-full h-full bg-slate-900 rounded-lg p-1 flex flex-col">
                <div className="text-[5px] text-slate-400 mb-0.5">Review</div>
                {/* Stars */}
                <div className="flex gap-0.5 mb-1 justify-center">
                  <Star className={`w-2 h-2 ${stepIsLit ? 'fill-red-500 text-red-500' : 'fill-slate-600 text-slate-600'}`} />
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
                {stepIsLit && (
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
          <div className={`relative transition-all duration-500 ${stepIsLit ? 'scale-100' : 'scale-90 opacity-40'}`}>
            {/* Manager alert */}
            <div className={`w-14 h-10 rounded-lg border-2 flex items-center justify-center transition-colors duration-300 mx-auto ${
              stepIsLit ? 'bg-red-900/50 border-red-500' : 'bg-slate-700 border-slate-600'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${stepIsLit ? 'text-red-400' : 'text-slate-500'}`} />
            </div>
            {/* Too late indicator */}
            {stepIsLit && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                Too late!
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Visuals row - horizontally aligned */}
      <div className="flex justify-between max-w-2xl mx-auto mb-6">
        {steps.map((step, index) => (
          <div key={`visual-${step.id}`} className="flex-1 flex justify-center">
            <div className="h-20 flex items-center justify-center">
              <StepVisual index={index} />
            </div>
          </div>
        ))}
      </div>

      {/* Step indicators row - horizontally aligned */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={`indicator-${step.id}`} className="flex-1 flex flex-col items-center">
            {/* Step indicator dot with icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isLit(index)
                  ? activeStep === index
                    ? 'bg-red-500 scale-110 ring-4 ring-red-500/30'
                    : 'bg-red-500'
                  : 'bg-slate-700'
              }`}
            >
              <StepIcon
                step={step}
                isActive={activeStep === index}
                isLit={isLit(index)}
              />
            </div>

            {/* Label */}
            <p
              className={`text-xs mt-2 transition-colors duration-300 text-center max-w-[80px] ${
                isLit(index) ? 'text-red-400 font-semibold' : 'text-slate-500'
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
          isLit(4) ? 'bg-red-500/20 border border-red-500/50' : 'bg-slate-700/50'
        }`}>
          <AlertTriangle className={`w-4 h-4 ${isLit(4) ? 'text-red-400' : 'text-slate-500'}`} />
          <span className={`text-sm ${isLit(4) ? 'text-red-400' : 'text-slate-400'}`}>
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
