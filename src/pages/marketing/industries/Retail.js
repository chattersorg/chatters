import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  Users,
  ShoppingBag,
  CreditCard,
  Shirt,
  Check,
  Star,
  Shield,
  TrendingUp,
  BarChart3,
  Heart,
  Zap,
} from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import Footer from '../../../components/marketing/layout/Footer';

// ─────────────────────────────────────────────────────────────
// SECTION 1 - HERO
// ─────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative pt-32 pb-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Text */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
            Retail
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Catch Customer Frustration Before They Walk Out  - {' '}
            <span className="text-[#4E74FF]">Not After They Post About It</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Chatters helps retail teams identify staff issues, product problems, and service bottlenecks - all while customers are still in the store.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/try"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#4E74FF] rounded-full hover:bg-[#2F5CFF] transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              Book a Demo
            </Link>
          </div>
        </div>

        {/* Right Column - Product Screenshot */}
        <div className="relative">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Browser Chrome */}
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <div className="ml-4 flex-1 bg-white rounded-md px-3 py-1 text-sm text-gray-400">
                my.getchatters.com/dashboard
              </div>
            </div>
            {/* Screenshot Placeholder */}
            <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
              <img
                src="https://placehold.co/550x400/e2e8f0/475569?text=Retail+Dashboard"
                alt="Retail feedback dashboard"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 2 - THE PROBLEM
// ─────────────────────────────────────────────────────────────
const Problem = () => (
  <section className="py-20 bg-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          The Problem Retail Stores{' '}
          <span className="text-[#4E74FF]">Face</span>
        </h2>
        <p className="text-xl text-slate-300 mb-8">
          Retail customers rarely complain to staff.
        </p>
        <p className="text-lg text-slate-400 mb-6">
          Instead they:
        </p>
        <div className="grid sm:grid-cols-2 gap-6 mb-10 max-w-xl mx-auto">
          {[
            'Leave quietly',
            'Buy less than planned',
            'Tell friends',
            'Leave negative reviews later',
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
              <p className="text-slate-300">{item}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-slate-400 mb-6">
          Common problems:
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {[
            'Long fitting room waits',
            'Unhelpful staff interactions',
            'Poor product knowledge',
            'Missing sizes',
            'Stock problems',
            'Slow checkout flow',
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0"></div>
              <p className="text-slate-300 text-sm">{item}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-slate-300 mb-4">
          But these issues rarely surface on the shop floor.
        </p>
        <p className="text-xl text-white font-semibold">
          Chatters exposes them - instantly.
        </p>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 3 - WHAT CHATTERS DOES FOR RETAIL
// ─────────────────────────────────────────────────────────────
const WhatChattersDoesSection = () => {
  const features = [
    {
      title: 'Capture issues instantly',
      description: 'Customers report friction as it happens.',
    },
    {
      title: 'Improve staff interactions',
      description: 'Feedback tied to team performance.',
    },
    {
      title: 'Reduce negative reviews',
      description: 'Recover service before customers leave.',
    },
    {
      title: 'Identify bottlenecks',
      description: 'Changing room delays, queue issues, stock shortages.',
    },
    {
      title: 'Improve store layout & experience',
      description: 'Trends reveal what frustrates customers most.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Chatters Does for{' '}
            <span className="text-[#4E74FF]">Retail</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#4E74FF]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-5 h-5 text-[#4E74FF]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 4 - RETAIL SCENARIOS
// ─────────────────────────────────────────────────────────────
const Scenarios = () => {
  const scenarios = [
    {
      icon: Shirt,
      title: 'Slow fitting room queue',
      description: 'Guests rate low → staff alerted → supervisor adds support.',
    },
    {
      icon: Users,
      title: 'Unhelpful staff interaction',
      description: 'Comment flagged → manager intervenes politely.',
    },
    {
      icon: ShoppingBag,
      title: 'Product quality complaints',
      description: 'Multiple reports → buyer reviews batch.',
    },
    {
      icon: CreditCard,
      title: 'Checkout bottleneck',
      description: 'Feedback reveals delays → manager opens extra till.',
    },
    {
      icon: AlertCircle,
      title: 'Stock frustrations',
      description: 'Guests report missing sizes → staff respond immediately.',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Retail Scenarios{' '}
            <span className="text-[#4E74FF]">Chatters Solves</span>
          </h2>
        </div>
        <div className="space-y-6 max-w-3xl mx-auto">
          {scenarios.map((scenario, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#4E74FF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <scenario.icon className="w-6 h-6 text-[#4E74FF]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{scenario.title}</h3>
                  <p className="text-gray-600">{scenario.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xl text-gray-600 mt-12 font-medium">
          Retail success = friction removed fast.
        </p>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 5 - WHY RETAILERS DEPEND ON CHATTERS
// ─────────────────────────────────────────────────────────────
const WhyRetailers = () => {
  const benefits = [
    {
      icon: Shield,
      title: 'Reduce negative reviews',
      description: 'Catch issues before customers go public.',
    },
    {
      icon: TrendingUp,
      title: 'Improve NPS & loyalty',
      description: 'Happy customers purchase more - and return.',
    },
    {
      icon: Users,
      title: 'Improve team training',
      description: 'Real feedback drives real improvement.',
    },
    {
      icon: BarChart3,
      title: 'Optimise store operations',
      description: 'Peak-time insights reveal resource gaps.',
    },
    {
      icon: Heart,
      title: 'Raise customer satisfaction',
      description: 'A smoother experience = stronger brand.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Retailers Depend on{' '}
            <span className="text-[#4E74FF]">Chatters</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-[#4E74FF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-6 h-6 text-[#4E74FF]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 6 - A RETAIL STORY IN ACTION
// ─────────────────────────────────────────────────────────────
const StoryInAction = () => (
  <section className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          A Retail Story in Action
        </h2>
      </div>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <p className="text-lg text-gray-600 mb-6">A customer leaves:</p>

          {/* Quote callout */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl mb-8">
            <p className="text-lg text-gray-800 italic">
              "Tried to get help but no one was in the fitting room area."
            </p>
          </div>

          <p className="text-lg text-gray-600 mb-8">
            Chatters alerts the floor manager. She reassigns someone immediately.
          </p>

          <p className="text-lg text-gray-600 mb-4">Later, a public review appears:</p>

          {/* Review */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg text-gray-800 italic">
              "Got great help in the fitting room area - someone came over right away. Really impressed."
            </p>
          </div>

          <p className="text-xl font-bold text-gray-900 text-center">
            One alert. One reassignment. One happy customer.
          </p>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 7 - FINAL CTA
// ─────────────────────────────────────────────────────────────
const FinalCTA = () => (
  <section className="py-20 bg-slate-900">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
        Fix friction fast. Drive loyalty. Improve every visit.
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/try"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#4E74FF] rounded-full hover:bg-[#2F5CFF] transition-all duration-200 shadow-lg hover:shadow-xl group"
        >
          Start Free Trial
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          to="/demo"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Book a Demo
        </Link>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
const RetailPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Retail | Chatters - Real-Time Customer Feedback for Retail Stores</title>
        <meta
          name="description"
          content="Chatters helps retail teams identify staff issues, product problems, and service bottlenecks - all while customers are still in the store."
        />
        <meta
          name="keywords"
          content="retail feedback, customer satisfaction, store feedback, real-time feedback, retail technology, customer experience"
        />
        <meta property="og:title" content="Retail | Chatters" />
        <meta
          property="og:description"
          content="Catch customer frustration before they walk out - not after they post about it."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/industries/retail" />
      </Helmet>

      <Navbar />
      <Hero />
      <Problem />
      <WhatChattersDoesSection />
      <Scenarios />
      <WhyRetailers />
      <StoryInAction />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default RetailPage;
