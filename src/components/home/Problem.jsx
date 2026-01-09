import React, { useState, useEffect } from 'react';
import { AlertTriangle, HeartHandshake, Megaphone, MessageCircle, ShieldCheck, Smile } from 'lucide-react';

const Problem = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isLit = (index) => index <= activeStep;

  const steps = [
    { id: 0, label: 'Guest shares feedback', description: 'Scan, tap an emoji—no confrontation needed.', icon: MessageCircle },
    { id: 1, label: 'Team gets alert', description: 'Context delivered instantly: table, sentiment, notes.', icon: ShieldCheck },
    { id: 2, label: 'Staff resolves it', description: 'A quick check-in turns the moment around.', icon: HeartHandshake },
    { id: 3, label: 'Guest leaves happy', description: 'They feel heard—no silent exits.', icon: Smile },
    { id: 4, label: 'Review follows', description: 'Happy guests share online, not 1-star rants.', icon: Megaphone },
  ];

  return (
    <section className="bg-slate-900 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Keep every guest on the positive path
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Most unhappy guests never speak up. Chatters gives them a gentle way to share—and your team the signal to act before they walk out.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="bg-gradient-to-br from-slate-800/80 via-slate-900 to-slate-950 border border-white/5 rounded-3xl p-6 lg:p-8 shadow-2xl">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">

            {/* Left: Stats + Summary */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Silent exits saved</p>
                  <p className="text-3xl font-bold text-white mt-1">3 of 4</p>
                  <p className="text-xs text-emerald-300 mt-1">When teams respond in 5 min</p>
                </div>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Review lift</p>
                  <p className="text-3xl font-bold text-white mt-1">+1.2<span className="text-xl align-middle">★</span></p>
                  <p className="text-xs text-emerald-300 mt-1">From feedback-first guests</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <p className="text-slate-200 text-sm leading-relaxed">
                  <span className="text-white font-medium">The real-time loop:</span> Guest signals → Team responds → Issue resolved → Review earned. All before they leave.
                </p>
              </div>

              <div className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-500 border text-sm ${
                isLit(4) ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100' : 'bg-slate-800 border-white/10 text-slate-300'
              }`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>68% of unhappy guests stay silent. Chatters catches them.</span>
              </div>
            </div>

            {/* Right: Steps */}
            <div className="relative">
              <div className="space-y-2">
                {steps.map((step, index) => {
                  const isActive = activeStep === index;
                  const stepIsLit = isLit(index);
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={`relative pl-14 pr-4 py-3 rounded-xl border transition-all duration-500 ${
                        stepIsLit
                          ? 'bg-white/5 border-white/10'
                          : 'bg-slate-900/40 border-white/5'
                      } ${isActive ? 'ring-1 ring-emerald-400/50' : ''}`}
                    >
                      <div
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          stepIsLit
                            ? 'bg-gradient-to-br from-emerald-300 to-emerald-500 text-slate-900 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-700 text-slate-400'
                        } ${isActive ? 'scale-110' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className={`text-sm font-semibold ${stepIsLit ? 'text-white' : 'text-slate-500'}`}>
                        {step.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${stepIsLit ? 'text-slate-300' : 'text-slate-600'}`}>
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
