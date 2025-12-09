import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  LayoutGrid,
  BarChart3,
  AlertTriangle,
  Search,
  Clock,
  Check,
  Eye,
  Layers,
  Building2
} from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import Footer from '../../../components/marketing/layout/Footer';

// SECTION 1 — HERO
const Hero = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-1 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
              Multi-Location Control
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              One Dashboard. Every Venue. Complete Control.
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Multi-Location Control gives operators real-time oversight across all venues — ensuring consistency, quality, and service standards everywhere.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/try"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#4E74FF] rounded-lg hover:bg-[#2F5CFF] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Book a Demo
              </Link>
            </div>
          </div>

          <div className="order-2 lg:order-2 relative px-4 sm:px-0 mt-8 lg:mt-0">
            <div className="relative mx-4 sm:mx-0">
              <div className="bg-gray-900 rounded-xl p-2 pb-3 shadow-2xl">
                <div className="flex items-center gap-2 px-2 pb-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  </div>
                </div>
                {/* Multi-Location Control Mockup */}
                <div className="bg-white rounded-lg p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <span className="text-gray-900 text-sm font-medium">All Venues</span>
                    <span className="text-gray-400 text-xs">5 locations</span>
                  </div>

                  {/* Venue Cards */}
                  <div className="space-y-2">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-900 text-xs font-medium">The Crown</p>
                          <p className="text-gray-400 text-[10px]">Manchester</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-gray-900 text-xs font-medium">4.8</span>
                        </div>
                        <span className="text-emerald-600 text-[10px]">+0.2</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-900 text-xs font-medium">The Royal Oak</p>
                          <p className="text-gray-400 text-[10px]">Leeds</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-gray-900 text-xs font-medium">4.6</span>
                        </div>
                        <span className="text-emerald-600 text-[10px]">+0.1</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-900 text-xs font-medium">The Anchor</p>
                          <p className="text-gray-400 text-[10px]">Sheffield</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-gray-900 text-xs font-medium">4.2</span>
                        </div>
                        <span className="text-amber-600 text-[10px]">-0.1</span>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-900 text-xs font-medium">The Fox</p>
                          <p className="text-gray-400 text-[10px]">Liverpool</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-gray-900 text-xs font-medium">3.8</span>
                        </div>
                        <span className="text-red-600 text-[10px]">-0.3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 2 — THE PROBLEM
const Problem = () => {
  const items = [
    'Manager updates',
    'WhatsApp messages',
    'Handover notes',
    'Occasional visits',
    'Delayed reports',
  ];

  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            The Problem: You Can't Be Everywhere at Once
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Running multiple venues usually means relying on:
            </p>

            <ul className="space-y-2 text-left max-w-md mx-auto">
              {items.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <span className="text-slate-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-white font-semibold text-2xl pt-4">
              None of this gives you a reliable picture of what's happening across your group.
            </p>

            <p>
              Multi-Location Control gives you instant visibility — so every venue stays on track.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — WHAT IT SHOWS
const WhatItShows = () => {
  const features = [
    {
      icon: Eye,
      title: 'Live performance across all venues',
      description: 'Ratings, comments, issues — updated in real time.'
    },
    {
      icon: BarChart3,
      title: 'Side-by-side venue comparisons',
      description: 'Spot gaps and strengths instantly.'
    },
    {
      icon: AlertTriangle,
      title: 'Real-time service issues',
      description: 'Identify struggling venues early.'
    },
    {
      icon: Search,
      title: 'Table-level data per location',
      description: 'Drill down into specifics when needed.'
    },
    {
      icon: Layers,
      title: 'Unified source of truth',
      description: 'Every manager sees the same data — no conflicting reports.'
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Multi-Location Control Shows You
            </h2>
          </div>

          <div className="space-y-4 mb-12">
            {features.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-[#4E74FF]/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-[#4E74FF]" />
                </div>
                <div>
                  <span className="text-lg text-gray-900 font-medium">{item.title}</span>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 4 — HOW IT WORKS
const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      title: 'Each venue collects feedback as normal',
      description: 'No workflow changes for your teams.',
    },
    {
      number: '2',
      title: 'Chatters syncs all insights into one group dashboard',
      description: 'Simple, clean, powerful.',
    },
    {
      number: '3',
      title: 'You compare venues instantly',
      description: 'Live performance at a glance.',
    },
    {
      number: '4',
      title: 'Spot early warning signs',
      description: 'Intervene before issues turn into bad reviews.',
    },
    {
      number: '5',
      title: 'Maintain consistent standards across the group',
      description: 'Service, speed, quality — measured equally everywhere.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            How It Works
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block"></div>

            {steps.map((step, index) => (
              <div key={index} className="relative flex gap-6 pb-12 last:pb-0">
                <div className="flex-shrink-0 w-12 h-12 bg-[#4E74FF] rounded-full flex items-center justify-center text-white font-bold text-lg z-10">
                  {step.number}
                </div>

                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 5 — WHY OPERATORS DEPEND ON IT
const WhyOperators = () => {
  const benefits = [
    {
      title: 'Identify struggling venues early',
      description: 'Support them before ratings drop.',
    },
    {
      title: 'Celebrate top performers',
      description: "Replicate what they're doing well.",
    },
    {
      title: 'Maintain brand consistency',
      description: 'Guests should have the same experience in every venue.',
    },
    {
      title: 'Make better staffing decisions',
      description: 'Know where resources are needed.',
    },
    {
      title: 'Operate with complete confidence',
      description: 'Your entire operation — always visible.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Depend on Multi-Location Control
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex gap-4 items-start bg-gray-50 rounded-xl p-6"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-[#4E74FF] rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// SECTION 6 — FEATURES
const Features = () => {
  const features = [
    {
      icon: LayoutGrid,
      title: 'Group Overview Screen',
      description: 'Your entire estate on one dashboard.',
    },
    {
      icon: BarChart3,
      title: 'Cross-Venue Rating Comparisons',
      description: 'Spot top- and low-performing locations fast.',
    },
    {
      icon: AlertTriangle,
      title: 'Recurring Issue Detection',
      description: 'Identify patterns venue by venue.',
    },
    {
      icon: Search,
      title: 'Venue-Level Drilldown',
      description: 'See table-level issues for any site.',
    },
    {
      icon: Clock,
      title: 'Shift Performance Insights',
      description: 'Lunch, dinner, weekends — across all venues.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Features Built for Multi-Site Operators
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#4E74FF]/50 hover:shadow-md transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#4E74FF]/10 rounded-xl mb-4">
                <feature.icon className="w-7 h-7 text-[#4E74FF]" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>

              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// SECTION 7 — IN ACTION
const InAction = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Multi-Location Control in Action
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A regional manager oversees five venues.
            </p>

            <p className="text-lg text-gray-700">
              In the group dashboard she sees:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• <span className="font-semibold">Venue A:</span> service slowdown during lunch</p>
              <p className="text-gray-700">• <span className="font-semibold">Venue B:</span> exceptional friendliness ratings</p>
              <p className="text-gray-700">• <span className="font-semibold">Venue C:</span> repeated comments about delayed mains</p>
            </div>

            <p className="text-lg text-gray-700">
              She takes action:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• Sends extra staff support to Venue A</p>
              <p className="text-gray-700">• Shares Venue B's best practices</p>
              <p className="text-gray-700">• Reviews kitchen process at Venue C</p>
            </div>

            <p className="text-lg text-gray-700">
              Later that week, a guest leaves:
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Same great service across both locations. Really impressed with the consistency."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 8 — TESTIMONIAL
const Testimonial = () => {
  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-2xl sm:text-3xl text-gray-700 italic mb-8 leading-relaxed">
            "The group dashboard changed the way we operate. I know exactly where to focus before problems grow."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">L</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Liam Harris</p>
              <p className="text-gray-600">Area Manager, The Brass & Oak Group</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 9 — FINAL CTA
const FinalCTA = () => {
  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-10">
            One dashboard. Every venue. Total clarity.
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/try"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#4E74FF] rounded-lg hover:bg-[#2F5CFF] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-transparent border-2 border-white rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// MAIN PAGE COMPONENT
const MultiLocationControlPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Multi-Location Control | Manage All Venues in One Dashboard | Chatters</title>
        <meta
          name="description"
          content="One dashboard. Every venue. Complete control. Multi-Location Control gives operators real-time oversight across all venues — ensuring consistency, quality, and service standards everywhere."
        />
        <meta
          name="keywords"
          content="multi-location control, multi-venue management, hospitality group, restaurant chain, venue oversight, centralized dashboard"
        />
        <meta property="og:title" content="Multi-Location Control | Chatters" />
        <meta property="og:description" content="One dashboard. Every venue. Complete control across your hospitality group." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/multi-venue/control" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <WhatItShows />
      <HowItWorks />
      <WhyOperators />
      <Features />
      <InAction />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default MultiLocationControlPage;
