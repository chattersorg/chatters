import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  Clock,
  Users,
  Thermometer,
  Utensils,
  Check,
  Star,
  Shield,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import Footer from '../../../components/marketing/layout/Footer';

// ─────────────────────────────────────────────────────────────
// SECTION 1 — HERO
// ─────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative pt-32 pb-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Text */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
            Restaurants
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Fix Service Issues Before Guests Leave —{' '}
            <span className="text-[#4E74FF]">Not After They Review You</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Chatters helps restaurants catch unhappy guests in real time, recover service instantly, and boost online ratings — all during the same visit.
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
                src="https://placehold.co/550x400/e2e8f0/475569?text=Restaurant+Dashboard"
                alt="Restaurant feedback dashboard"
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
// SECTION 2 — THE PROBLEM
// ─────────────────────────────────────────────────────────────
const Problem = () => (
  <section className="py-20 bg-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          The Problem Restaurants Face{' '}
          <span className="text-[#4E74FF]">Every Day</span>
        </h2>
        <p className="text-xl text-slate-300 mb-8">
          Restaurant service is fast, unpredictable, and high-pressure.
        </p>
        <p className="text-lg text-slate-400 mb-8">
          And most issues happen quietly:
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Thermometer, text: 'A main arrives cold' },
            { icon: Clock, text: 'A guest waits too long' },
            { icon: Users, text: 'A server misses a table' },
            { icon: Utensils, text: "A dish isn't to taste" },
            { icon: AlertCircle, text: "A couple tries to get attention but can't" },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-slate-300 mb-4">
          Most unhappy guests never complain in person. They just leave — and review you later.
        </p>
        <p className="text-xl text-white font-semibold">
          Chatters turns these silent moments into real-time opportunities to recover the experience.
        </p>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 3 — WHAT CHATTERS DOES FOR RESTAURANTS
// ─────────────────────────────────────────────────────────────
const WhatChattersDoesSection = () => {
  const features = [
    {
      title: 'Catch issues during the meal',
      description: 'Know immediately when a table is unhappy.',
    },
    {
      title: 'Recover service before guests leave',
      description: "Resolve problems while they're still seated.",
    },
    {
      title: 'Prevent 1-star reviews',
      description: 'Unhappy tables become satisfied guests.',
    },
    {
      title: 'Boost Google/TripAdvisor ratings',
      description: 'Happy guests are guided to leave positive reviews.',
    },
    {
      title: 'Improve shift consistency',
      description: 'Teams stay aligned, even during peak hours.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Chatters Does for{' '}
            <span className="text-[#4E74FF]">Restaurants</span>
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
        <p className="text-center text-xl text-gray-600 mt-12">
          Restaurants run better when service issues don't go unseen.
        </p>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 4 — REAL RESTAURANT MOMENTS
// ─────────────────────────────────────────────────────────────
const Scenarios = () => {
  const scenarios = [
    {
      title: 'Slow mains during peak hours',
      description: 'Guests quietly rate low → kitchen alerted → manager supports pass.',
    },
    {
      title: 'Cold dish sent back',
      description: 'Guest leaves comment → server notified before it becomes a complaint.',
    },
    {
      title: 'Missed table',
      description: 'Low rating highlights forgotten table → staff react immediately.',
    },
    {
      title: 'Dietary request miscommunication',
      description: 'Comment flagged instantly → manager fixes it mid-service.',
    },
    {
      title: 'Server having an off-night',
      description: 'Repeated low ratings during a shift → manager intervenes.',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Real Restaurant Moments{' '}
            <span className="text-[#4E74FF]">Chatters Solves</span>
          </h2>
        </div>
        <div className="space-y-6 max-w-3xl mx-auto">
          {scenarios.map((scenario, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{scenario.title}</h3>
              <p className="text-gray-600">{scenario.description}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xl text-gray-600 mt-12 font-medium">
          This is real-time hospitality — not guesswork.
        </p>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 5 — WHY RESTAURANTS DEPEND ON CHATTERS
// ─────────────────────────────────────────────────────────────
const WhyRestaurants = () => {
  const benefits = [
    {
      icon: Shield,
      title: 'Protect your reputation',
      description: 'Avoid the 1-star reviews that damage business.',
    },
    {
      icon: RefreshCw,
      title: 'Increase repeat visits',
      description: 'Guests who feel heard come back.',
    },
    {
      icon: Users,
      title: 'Strengthen teamwork',
      description: 'Staff see issues, priorities, and feedback clearly.',
    },
    {
      icon: TrendingUp,
      title: 'Improve food & service quality',
      description: 'Identify recurring problems fast.',
    },
    {
      icon: Calendar,
      title: 'Run smoother weekend services',
      description: 'Peak hours become manageable with real-time visibility.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Restaurants Depend on{' '}
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
// SECTION 6 — A RESTAURANT STORY IN ACTION
// ─────────────────────────────────────────────────────────────
const StoryInAction = () => (
  <section className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          A Restaurant Story in Action
        </h2>
      </div>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <p className="text-lg text-gray-600 mb-6">A table quietly leaves:</p>

          {/* Quote callout */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl mb-8">
            <p className="text-lg text-gray-800 italic">
              "Food great, but mains took ages."
            </p>
          </div>

          <p className="text-lg text-gray-600 mb-8">
            Chatters flags it instantly. Manager supports the pass. Speed improves that very shift.
          </p>

          <p className="text-lg text-gray-600 mb-4">The next day, a review appears:</p>

          {/* Review */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg text-gray-800 italic">
              "Service was brilliant — they handled everything perfectly. Will definitely return."
            </p>
          </div>

          <p className="text-xl font-bold text-gray-900 text-center">
            One moment. One intervention. One review saved.
          </p>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 7 — FINAL CTA
// ─────────────────────────────────────────────────────────────
const FinalCTA = () => (
  <section className="py-20 bg-slate-900">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
        Turn silent complaints into real-time recoveries.
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
const RestaurantsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Restaurants | Chatters - Real-Time Guest Feedback for Restaurants</title>
        <meta
          name="description"
          content="Chatters helps restaurants catch unhappy guests in real time, recover service instantly, and boost online ratings — all during the same visit."
        />
        <meta
          name="keywords"
          content="restaurant feedback, restaurant reviews, guest satisfaction, real-time feedback, hospitality technology"
        />
        <meta property="og:title" content="Restaurants | Chatters" />
        <meta
          property="og:description"
          content="Fix service issues before guests leave — not after they review you."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/industries/restaurants" />
      </Helmet>

      <Navbar />
      <Hero />
      <Problem />
      <WhatChattersDoesSection />
      <Scenarios />
      <WhyRestaurants />
      <StoryInAction />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default RestaurantsPage;
