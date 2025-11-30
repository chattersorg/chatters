import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  Volume2,
  Coffee,
  UserCheck,
  Thermometer,
  Check,
  Star,
  Shield,
  MessageSquare,
  Users,
  BarChart3,
  Heart,
  Bed,
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
            Hotels
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Fix Guest Issues During Their Stay —{' '}
            <span className="text-[#4E74FF]">Not After They Check Out</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Chatters helps hotels detect dissatisfaction instantly, resolve problems before guests depart, and protect your online reputation across every department.
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
                src="https://placehold.co/550x400/e2e8f0/475569?text=Hotel+Dashboard"
                alt="Hotel feedback dashboard"
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
          The Problem Hotels{' '}
          <span className="text-[#4E74FF]">Face</span>
        </h2>
        <p className="text-xl text-slate-300 mb-8">
          Hotel guests rarely complain at the front desk.
        </p>
        <p className="text-lg text-slate-400 mb-8">
          Instead, they:
        </p>
        <div className="grid sm:grid-cols-2 gap-6 mb-12 max-w-xl mx-auto">
          {[
            'Keep quiet',
            'Leave early',
            'Check out politely',
            'Then post reviews later about things you never knew',
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
              <p className="text-slate-300">{item}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-slate-300 mb-4">
          Whether it's housekeeping, breakfast, check-in, room temperature, or noise — problems often surface after departure.
        </p>
        <p className="text-xl text-white font-semibold">
          Chatters changes that.
        </p>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 3 — WHAT CHATTERS DOES FOR HOTELS
// ─────────────────────────────────────────────────────────────
const WhatChattersDoesSection = () => {
  const features = [
    {
      title: 'Capture issues mid-stay',
      description: 'Guests share concerns quickly and privately.',
    },
    {
      title: 'Alert staff instantly',
      description: 'Front desk, housekeeping, restaurant — whoever needs to know.',
    },
    {
      title: 'Prevent negative reviews',
      description: 'Resolve issues before checkout.',
    },
    {
      title: 'Improve multi-department coordination',
      description: 'One guest issue → the right team notified.',
    },
    {
      title: 'Boost online ratings',
      description: 'Happy guests leave reviews. Chatters prompts them.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Chatters Does for{' '}
            <span className="text-[#4E74FF]">Hotels</span>
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
          Hotels win when problems are caught before they become public.
        </p>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 4 — HOTEL SCENARIOS
// ─────────────────────────────────────────────────────────────
const Scenarios = () => {
  const scenarios = [
    {
      icon: Bed,
      title: 'Room not properly cleaned',
      description: 'Guest reports → housekeeping notified instantly → fixed before it becomes a complaint.',
    },
    {
      icon: Volume2,
      title: 'Noise complaints',
      description: 'Low rating triggers alert → staff offer quieter room or compensation.',
    },
    {
      icon: Coffee,
      title: 'Breakfast delays',
      description: 'Multiple guests mention it → real-time trend surfaced.',
    },
    {
      icon: UserCheck,
      title: 'Check-in problems',
      description: 'Sentiment shows frustration → manager intervenes early.',
    },
    {
      icon: Thermometer,
      title: 'Room temperature complaints',
      description: 'Guest reports AC issue → maintenance alerted → fixed within the hour.',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Hotel Scenarios{' '}
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
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 5 — WHY HOTELS DEPEND ON CHATTERS
// ─────────────────────────────────────────────────────────────
const WhyHotels = () => {
  const benefits = [
    {
      icon: Star,
      title: 'Better reviews on Google & TripAdvisor',
      description: 'Stop dissatisfaction from leaving the building.',
    },
    {
      icon: Shield,
      title: 'Better service recovery',
      description: 'Fix issues before they ruin a stay.',
    },
    {
      icon: MessageSquare,
      title: 'Better communication between teams',
      description: 'Front desk, restaurant, housekeeping, breakfast — aligned.',
    },
    {
      icon: BarChart3,
      title: 'Better insight into operations',
      description: 'Know which departments cause the most friction.',
    },
    {
      icon: Heart,
      title: 'Better guest satisfaction',
      description: 'Guests feel heard, supported, valued.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Hotels Depend on{' '}
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
// SECTION 6 — A HOTEL STORY IN ACTION
// ─────────────────────────────────────────────────────────────
const StoryInAction = () => (
  <section className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          A Hotel Story in Action
        </h2>
      </div>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <p className="text-lg text-gray-600 mb-6">A guest leaves this mid-stay comment:</p>

          {/* Quote callout */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl mb-8">
            <p className="text-lg text-gray-800 italic">
              "Room is nice but there's a constant humming noise."
            </p>
          </div>

          <p className="text-lg text-gray-600 mb-8">
            Chatters alerts reception instantly. Reception moves the guest to a quieter room and sends complimentary drinks.
          </p>

          <p className="text-lg text-gray-600 mb-4">After checkout, the guest posts:</p>

          {/* Review */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg text-gray-800 italic">
              "Had a noise issue but reception moved us straight away and even sent drinks to apologise. That's how you do service."
            </p>
          </div>

          <p className="text-xl font-bold text-gray-900 text-center">
            One alert. One recovery. One five-star review.
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
        Catch issues early. Recover service fast. Protect your reputation.
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
const HotelsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Hotels | Chatters - Real-Time Guest Feedback for Hotels</title>
        <meta
          name="description"
          content="Chatters helps hotels detect dissatisfaction instantly, resolve problems before guests depart, and protect your online reputation across every department."
        />
        <meta
          name="keywords"
          content="hotel feedback, hotel reviews, guest satisfaction, real-time feedback, hospitality technology, hotel management"
        />
        <meta property="og:title" content="Hotels | Chatters" />
        <meta
          property="og:description"
          content="Fix guest issues during their stay — not after they check out."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/industries/hotels" />
      </Helmet>

      <Navbar />
      <Hero />
      <Problem />
      <WhatChattersDoesSection />
      <Scenarios />
      <WhyHotels />
      <StoryInAction />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default HotelsPage;
