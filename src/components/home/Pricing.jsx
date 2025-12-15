import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

const Pricing = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-sky-900 py-20 lg:py-24 text-white">
      <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-sky-500 blur-3xl" />
        <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-indigo-500 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-500 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-sky-100 ring-1 ring-white/20">
              <Sparkles className="h-4 w-4" />
              Pricing you'll actually understand
            </span>
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-slate-100/90 max-w-2xl">
                Stop guessing budgets. Get one clear price that scales with your venue and a team
                dedicated to keeping costs predictable.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {["No complicated tiers", "No per-staff fees", "No hidden charges", "Guided onboarding"]
                .map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    <span className="text-base font-medium text-white">{item}</span>
                  </div>
                ))}
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-100/80">
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
              <span>Transparent invoicing, live support, and pricing that's tailored to your venue.</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-400/40 via-sky-400/30 to-emerald-300/40 blur-2xl" aria-hidden="true" />
            <div className="relative bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 border border-white/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">All-inclusive platform</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">One fair rate, tailored to you</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                  No surprises
                </span>
              </div>

              <div className="mt-8 space-y-4 text-left">
                {["Unlimited staff access", "Full feature access from day one", "Hands-on setup with our team", "Flexible terms with price lock"]
                  .map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-500" />
                      <p className="text-base text-slate-700">{benefit}</p>
                    </div>
                  ))}
              </div>

              <div className="mt-8 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 p-5 text-left border border-indigo-100">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-900">Pricing assurance</p>
                    <p className="text-sm text-slate-600">We'll walk through the right plan for your venue during your demo and lock in a transparent rate.</p>
                  </div>
                </div>
              </div>

              <Link
                to="/demo"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-300/40 transition-transform duration-200 hover:scale-[1.01] hover:shadow-xl"
              >
                Book a Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
