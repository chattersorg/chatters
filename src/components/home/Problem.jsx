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
    { id: 0, label: 'Guest shares feedback', description: 'Scan, tap an emoji without confrontation.', icon: MessageCircle },
    { id: 1, label: 'Team gets alert', description: 'Context delivered instantly: table, sentiment, notes.', icon: ShieldCheck },
    { id: 2, label: 'Staff resolves it', description: 'A quick check-in turns the moment around.', icon: HeartHandshake },
    { id: 3, label: 'Guest leaves happy', description: 'They feel heard with no silent exits.', icon: Smile },
    { id: 4, label: 'Review follows', description: 'Happy guests share online, not 1-star rants.', icon: Megaphone },
  ];

  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 lg:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-[110px]" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.6) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] items-end mb-12">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80 mb-4">
              Guest-first recovery
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Keep every guest on the positive path
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0">
              Most unhappy guests never speak up. Chatters gives them a gentle way to share and your team the signal to act before they walk out.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-200 uppercase tracking-wide">Silent exits saved</p>
              <p className="text-3xl sm:text-4xl font-bold text-white mt-2">3 of 4</p>
              <p className="text-xs text-emerald-200/80 mt-2">When teams respond in 5 min</p>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-xs text-amber-100 uppercase tracking-wide">Review lift</p>
              <p className="text-3xl sm:text-4xl font-bold text-white mt-2">+1.2<span className="text-xl align-middle">★</span></p>
              <p className="text-xs text-amber-100/80 mt-2">From feedback-first guests</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
              <p className="text-sm text-slate-200 leading-relaxed">
                <span className="text-white font-medium">The real-time loop:</span> Guest signals → Team responds → Issue resolved → Review earned. All before they leave.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 sm:col-span-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>68% of unhappy guests stay silent. Chatters catches them.</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="bg-gradient-to-br from-slate-900/80 via-slate-950 to-black/80 border border-white/10 rounded-[28px] p-6 lg:p-10 shadow-2xl">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">

            {/* Left: Stats + Summary */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">The real-time loop</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                  {['Guest signals', 'Team responds', 'Issue resolved', 'Review earned'].map((step, index) => (
                    <span
                      key={step}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                        isLit(index)
                          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                          : 'border-white/10 bg-white/5 text-slate-300'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {step}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <p className="text-sm text-slate-200 leading-relaxed">
                  When the loop starts in the moment, guests stay in control and teams stay in front of issues.
                </p>
              </div>
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-500 border text-sm ${
                  isLit(4) ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100' : 'bg-slate-900 border-white/10 text-slate-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>68% of unhappy guests stay silent. Chatters catches them.</span>
              </div>
            </div>

            {/* Right: Steps */}
            <div className="relative">
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isActive = activeStep === index;
                  const stepIsLit = isLit(index);
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={`relative pl-14 pr-4 py-4 rounded-2xl border transition-all duration-500 ${
                        stepIsLit
                          ? 'bg-white/5 border-white/15'
                          : 'bg-slate-900/40 border-white/5'
                      } ${isActive ? 'ring-2 ring-emerald-400/60' : ''}`}
                    >
                      <div className={`absolute left-7 top-0 h-full w-px ${stepIsLit ? 'bg-emerald-500/30' : 'bg-white/5'}`} />
                      <div
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
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
                      <p className={`text-xs mt-1 ${stepIsLit ? 'text-slate-300' : 'text-slate-600'}`}>
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
