import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

const Pricing = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F5F7FF] to-[#E7EEFF] py-20 lg:py-24 text-slate-900">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -left-28 -top-24 h-72 w-72 rounded-full bg-[#4E74FF]/15 blur-3xl" />
        <div className="absolute right-10 top-8 h-80 w-80 rounded-full bg-[#7FB1FF]/20 blur-3xl" />
        <div className="absolute bottom-4 left-1/3 h-64 w-64 rounded-full bg-emerald-200/25 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white shadow-sm px-4 py-2 text-sm font-semibold text-[#4E74FF] ring-1 ring-[#4E74FF]/15">
              <Sparkles className="h-4 w-4" />
              Pricing you'll actually understand
            </span>
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-slate-700 max-w-2xl">
                Stop guessing budgets. Get one clear price that scales with your venue and a team
                dedicated to keeping costs predictable.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {["No complicated tiers", "No per-staff fees", "No hidden charges", "Guided onboarding"]
                .map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-base font-medium text-slate-900">{item}</span>
                  </div>
                ))}
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-600">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span>Transparent invoicing, live support, and pricing that's tailored to your venue.</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#4E74FF]/30 via-[#9BC6FF]/25 to-[#B5F3E8]/30 blur-3xl" aria-hidden="true" />
            <div className="relative bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 border border-white/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#4E74FF]">All-inclusive platform</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">One fair rate, tailored to you</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#4E74FF]/10 px-3 py-1 text-xs font-semibold text-[#4E74FF] ring-1 ring-[#4E74FF]/20">
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

              <div className="mt-8 rounded-xl bg-gradient-to-r from-[#F2F6FF] via-white to-[#E6F6F0] p-5 text-left border border-[#E4E9F7]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-[#4E74FF]" />
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-900">Pricing assurance</p>
                    <p className="text-sm text-slate-600">We'll walk through the right plan for your venue during your demo and lock in a transparent rate.</p>
                  </div>
                </div>
              </div>

              <Link
                to="/demo"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4E74FF] via-[#5F86FF] to-[#2F5CFF] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-[#4E74FF]/30 transition-transform duration-200 hover:scale-[1.01] hover:shadow-xl"
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
