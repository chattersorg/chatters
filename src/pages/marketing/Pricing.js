import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Check,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import Navbar from '../../components/marketing/layout/Navbar';
import Footer from '../../components/marketing/layout/Footer';

// Hero Section
const Hero = () => (
  <section className="relative pt-32 pb-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
          Pricing
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
          Simple, Transparent{' '}
          <span className="text-[#4E74FF]">Pricing</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Get everything you need to prevent negative reviews and capture real-time guest feedback, with flexible pricing that scales with your venue.
        </p>
      </div>
    </div>
  </section>
);

// Main Pricing Section (styled like homepage)
const PricingCard = () => (
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
              One fair rate, tailored to you
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-indigo-600">All-inclusive platform</p>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100 whitespace-nowrap">
                  No surprises
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">Everything you need, one price</p>
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

// What's Included Section
const WhatsIncluded = () => {
  const features = [
    "Unlimited guest feedback",
    "Instant staff alerts",
    "Multi-location reporting",
    "Role-based access & permissions",
    "Google & TripAdvisor routing",
    "Analytics & insights",
    "Custom branding",
    "Dedicated support",
    "NPS scoring",
    "Staff leaderboards",
    "Floor plan heatmaps",
    "Real-time kiosk mode"
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything Included,{' '}
            <span className="text-[#4E74FF]">No Add-Ons</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every feature is included in your plan. No tiered pricing, no feature gating.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-6 h-6 bg-[#4E74FF]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-[#4E74FF]" />
              </div>
              <span className="text-gray-700 font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const [openIndex, setOpenIndex] = React.useState(0);

  const faqs = [
    {
      q: "Do you publish your pricing?",
      a: "No, because every venue operates differently. We tailor pricing based on your number of locations, guest volume, and specific needs."
    },
    {
      q: "Is there a minimum contract?",
      a: "We offer flexible plans. Most venues choose annual billing for the best value, but monthly options are available too."
    },
    {
      q: "Do you charge per location or per staff member?",
      a: "Pricing is based on your venues, not per staff user. You can add unlimited staff without extra cost."
    },
    {
      q: "What's included in the subscription?",
      a: "All plans include unlimited feedback, instant alerts, analytics, custom branding, and review routing, no hidden fees."
    },
    {
      q: "Can we scale up later?",
      a: "Yes. Start with a single venue and add more locations anytime. Your pricing adjusts seamlessly as you grow."
    },
    {
      q: "Do you offer trials?",
      a: "Yes, new accounts start with a free 14-day trial so you can experience Chatters before committing."
    }
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
            Pricing FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Common Questions About Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            If you have a different question, contact us and we'll help.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-[#4E74FF] flex-shrink-0" />
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 pl-8">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Final CTA
const FinalCTA = () => (
  <section className="py-20 bg-slate-900">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
        Ready to Get Started?
      </h2>
      <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
        Book a demo and we'll walk through pricing tailored to your venue. No pressure, no hidden fees.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/demo"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#4E74FF] rounded-lg hover:bg-[#2F5CFF] transition-all duration-200 shadow-lg hover:shadow-xl group"
        >
          Book a Demo
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          to="/try"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition-all duration-200"
        >
          Start Free Trial
        </Link>
      </div>
    </div>
  </section>
);

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Restaurant Feedback Software Pricing UK | Flexible Plans | Chatters</title>
        <meta
          name="description"
          content="Transparent pricing for UK restaurants, pubs & hotels. Chatters feedback management starts from just £149/month. No setup fees, unlimited staff users, 14-day free trial. Book a tailored quote today."
        />
        <meta
          name="keywords"
          content="restaurant feedback software pricing UK, hospitality software cost, pub management software prices, customer feedback system cost, restaurant technology pricing, Chatters pricing, UK hospitality software"
        />
        <meta property="og:title" content="Restaurant Feedback Software Pricing UK | Chatters" />
        <meta
          property="og:description"
          content="Transparent pricing for UK restaurants, pubs & hotels. Chatters feedback management starts from £149/month. No setup fees, unlimited staff users, 14-day free trial."
        />
        <meta property="og:type" content="website" />
        <meta property="twitter:title" content="Restaurant Feedback Software Pricing UK | Chatters" />
        <meta property="twitter:description" content="Transparent pricing for UK restaurants, pubs & hotels. Chatters feedback management starts from £149/month. Free trial available." />
        <link rel="canonical" href="https://getchatters.com/pricing" />
      </Helmet>

      <Navbar />
      <Hero />
      <PricingCard />
      <WhatsIncluded />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default PricingPage;
