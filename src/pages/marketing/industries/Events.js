import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  Users,
  Clock,
  Beer,
  MapPin,
  Check,
  Star,
  Shield,
  TrendingUp,
  BarChart3,
  Megaphone,
  Utensils,
  Navigation,
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
            Events
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Improve Guest Experience Across Your Entire Event  - {' '}
            <span className="text-[#4E74FF]">In Real Time</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Chatters helps event organisers catch issues instantly, manage crowd flow, and ensure guests have an exceptional experience from entry to exit.
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
                src="https://placehold.co/550x400/e2e8f0/475569?text=Event+Dashboard"
                alt="Event feedback dashboard"
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
          The Problem Event Organisers{' '}
          <span className="text-[#4E74FF]">Face</span>
        </h2>
        <p className="text-xl text-slate-300 mb-8">
          Events move fast. Thousands of guests. Many touchpoints.
        </p>
        <p className="text-lg text-slate-400 mb-6">
          Issues can arise anywhere:
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {[
            { icon: Clock, text: 'Entry queues' },
            { icon: Beer, text: 'Bar delays' },
            { icon: Utensils, text: 'Food vendor bottlenecks' },
            { icon: Users, text: 'Crowd congestion' },
            { icon: AlertCircle, text: 'Accessibility problems' },
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
          If you hear about it, it's often too late.
        </p>
        <p className="text-xl text-white font-semibold">
          Chatters gives guests a simple way to tell you instantly.
        </p>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 3 - WHAT CHATTERS DOES FOR EVENTS
// ─────────────────────────────────────────────────────────────
const WhatChattersDoesSection = () => {
  const features = [
    {
      title: 'Capture guest issues in real time',
      description: 'Instant alerts about queues, service dips, or crowd problems.',
    },
    {
      title: 'Improve event flow',
      description: 'Identify and fix bottlenecks quickly.',
    },
    {
      title: 'Increase guest satisfaction',
      description: 'Respond to issues during the event.',
    },
    {
      title: 'Reduce complaints afterward',
      description: 'Resolve problems before guests leave.',
    },
    {
      title: 'Improve vendor management',
      description: "See which partners deliver - and which don't.",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Chatters Does for{' '}
            <span className="text-[#4E74FF]">Events</span>
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
// SECTION 4 - EVENT SCENARIOS
// ─────────────────────────────────────────────────────────────
const Scenarios = () => {
  const scenarios = [
    {
      icon: Beer,
      title: 'Long bar wait times',
      description: 'Guests report delays → staff reallocations → queue clears.',
    },
    {
      icon: Users,
      title: 'Toilet queue spikes',
      description: 'Quick alerts → additional facilities opened.',
    },
    {
      icon: MapPin,
      title: 'Crowd congestion',
      description: 'Guests report slow zones → security adjusts routing.',
    },
    {
      icon: Utensils,
      title: 'Food vendor running out of stock',
      description: 'Multiple guests report empty stall → event team contacts vendor → restocked quickly.',
    },
    {
      icon: Navigation,
      title: 'Confusion with signage',
      description: 'Trend detected → staff placed to direct guests.',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Event Scenarios{' '}
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
          Events become smoother, safer, and more enjoyable.
        </p>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 5 - WHY EVENT ORGANISERS DEPEND ON CHATTERS
// ─────────────────────────────────────────────────────────────
const WhyEvents = () => {
  const benefits = [
    {
      icon: TrendingUp,
      title: 'Improve satisfaction instantly',
      description: 'Fix issues before they escalate.',
    },
    {
      icon: Shield,
      title: 'Keep guests safe',
      description: 'Identify crowding early.',
    },
    {
      icon: BarChart3,
      title: 'Strengthen vendor management',
      description: 'Data-backed conversations with partners.',
    },
    {
      icon: MapPin,
      title: 'Improve future events',
      description: 'Use data to plan better layouts & staffing.',
    },
    {
      icon: Megaphone,
      title: 'Reduce negative social media noise',
      description: 'Guests feel heard during the event.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Event Organisers Depend on{' '}
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
// SECTION 6 - AN EVENT STORY IN ACTION
// ─────────────────────────────────────────────────────────────
const StoryInAction = () => (
  <section className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          An Event Story in Action
        </h2>
      </div>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <p className="text-lg text-gray-600 mb-6">Guests leave comments like:</p>

          {/* Quote callouts */}
          <div className="space-y-4 mb-8">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
              <p className="text-gray-800 italic">"Bar queue is huge."</p>
            </div>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
              <p className="text-gray-800 italic">"Long wait for drinks."</p>
            </div>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
              <p className="text-gray-800 italic">"Line not moving."</p>
            </div>
          </div>

          <p className="text-lg text-gray-600 mb-4">
            Chatters flags "Bar Congestion" as a rising issue.
          </p>
          <p className="text-lg text-gray-600 mb-8">
            The event manager opens a second service point.
          </p>

          <p className="text-lg text-gray-600 mb-4">Later that night, a guest posts:</p>

          {/* Review */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg text-gray-800 italic">
              "Bar queue was bad at first but they opened another one fast. Staff were really on it. Great night."
            </p>
          </div>

          <p className="text-xl font-bold text-gray-900 text-center">
            Real-time insight. Fast action. Happy guests.
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
        Deliver exceptional events - powered by real-time guest insight.
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
const EventsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Events | Chatters - Real-Time Guest Feedback for Events</title>
        <meta
          name="description"
          content="Chatters helps event organisers catch issues instantly, manage crowd flow, and ensure guests have an exceptional experience from entry to exit."
        />
        <meta
          name="keywords"
          content="event feedback, event management, crowd management, real-time feedback, guest experience, event technology"
        />
        <meta property="og:title" content="Events | Chatters" />
        <meta
          property="og:description"
          content="Improve guest experience across your entire event - in real time."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/industries/events" />
      </Helmet>

      <Navbar />
      <Hero />
      <Problem />
      <WhatChattersDoesSection />
      <Scenarios />
      <WhyEvents />
      <StoryInAction />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default EventsPage;
