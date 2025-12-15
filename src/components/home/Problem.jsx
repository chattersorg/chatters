import React, { useState, useEffect } from 'react';
import { AlertTriangle, HeartHandshake, Megaphone, MessageCircle, ShieldCheck, Smile, Sparkles } from 'lucide-react';

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
    {
      id: 0,
      label: 'Guest shares quick feedback',
      description: 'They scan the table card and tap one emoji—no awkward confrontation needed.',
      icon: MessageCircle,
    },
    {
      id: 1,
      label: 'Team gets real-time alert',
      description: 'Chatters delivers context instantly with the table, sentiment, and guest notes.',
      icon: ShieldCheck,
    },
    {
      id: 2,
      label: 'Staff resolves on the spot',
      description: 'A quick check-in, a comped dessert, or a manager hello turns the moment around.',
      icon: HeartHandshake,
    },
    {
      id: 3,
      label: 'Guest leaves delighted',
      description: 'They feel heard before they walk out—no silent exits or surprise complaints.',
      icon: Smile,
    },
    {
      id: 4,
      label: 'Positive review follows',
      description: 'Happy guests become advocates and share the story online instead of a 1-star rant.',
      icon: Megaphone,
    },
  ];

  const renderStep = (step, index) => {
    const isActive = activeStep === index;
    const stepIsLit = isLit(index);
    const Icon = step.icon;

    return (
      <div
        key={step.id}
        className={`relative pl-14 pr-4 py-4 rounded-2xl border transition-all duration-500 ${
          stepIsLit
            ? 'bg-white/5 border-white/10 shadow-lg shadow-slate-900/50 backdrop-blur'
            : 'bg-slate-900/40 border-white/5'
        } ${isActive ? 'ring-2 ring-emerald-400/50 translate-x-0.5' : ''}`}
      >
        <div
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            stepIsLit
              ? 'bg-gradient-to-br from-emerald-300 to-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/30'
              : 'bg-slate-700 text-slate-200'
          } ${isActive ? 'scale-110' : ''}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <p className={`text-xs font-semibold tracking-wide uppercase ${stepIsLit ? 'text-emerald-200' : 'text-slate-500'}`}>
          {step.label}
        </p>
        <p className="text-base text-slate-100 leading-relaxed mt-1">{step.description}</p>

        {stepIsLit && (
          <div className="mt-3 inline-flex items-center gap-2 text-emerald-200 text-sm bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-400/40">
            <Sparkles className="w-4 h-4" />
            <span>{index === 0 ? 'Friction-free for the guest' : 'Momentum keeps building'}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/80 via-slate-900 to-slate-950 border border-white/5 rounded-3xl p-6 lg:p-10 shadow-2xl shadow-slate-950/50 max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-100 text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            Guests stay, teams respond, reviews improve
          </div>

          <h3 className="text-2xl sm:text-3xl text-white font-semibold leading-tight">
            Transform quiet frustrations into memorable, five-star experiences.
          </h3>

          <p className="text-lg text-slate-200 leading-relaxed">
            Chatters unifies the guest signal and the team response in one real-time loop—so you can
            catch issues early, celebrate great service, and leave guests feeling cared for.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <p className="text-sm text-slate-400">Silent exits turned around</p>
              <p className="text-3xl font-bold text-white mt-1">3 of 4</p>
              <p className="text-sm text-emerald-200 mt-1">When teams respond within 5 minutes</p>
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <p className="text-sm text-slate-400">Lift in public reviews</p>
              <p className="text-3xl font-bold text-white mt-1">+1.2★</p>
              <p className="text-sm text-emerald-200 mt-1">From guests who shared feedback first</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-8 top-4 bottom-4 w-px bg-gradient-to-b from-emerald-500 via-emerald-300/60 to-transparent opacity-70 pointer-events-none" />
          <div className="space-y-4">
            {steps.map((step, index) => renderStep(step, index))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-500 border ${
          isLit(4) ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100' : 'bg-slate-800 border-white/5 text-slate-200'
        }`}>
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm sm:text-base">
            68% of unhappy guests stay silent—Chatters turns those moments into saved experiences.
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
            Keep every guest experience on the positive path
          </h2>

          {/* Body Text */}
          <div className="text-xl text-slate-300 space-y-6 mb-12">
            <p>
              <span className="text-white font-semibold">Most unhappy guests never say a word at the table.</span>
              <br />
              Chatters gives them a gentle way to share while they’re still with you.
            </p>

            <p>
              Your team gets the signal instantly, with context, so they can turn service moments into wins.
            </p>

            <p>
              The result: fewer silent exits, happier guests, and more glowing reviews that tell your story.
            </p>
          </div>

          {/* Visual */}
          <div className="mt-12">
            <GuestJourneyGraphic />
          </div>
        </div>
      </div>

    </section>
  );
};

export default Problem;
