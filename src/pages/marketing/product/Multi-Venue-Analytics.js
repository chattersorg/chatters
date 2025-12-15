import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  Grid3X3,
  PieChart,
  LineChart,
  Users,
  Download,
  Check,
  TrendingUp,
  Building2,
  BarChart3
} from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import Footer from '../../../components/marketing/layout/Footer';

// SECTION 1 - HERO
const Hero = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-1 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
              Multi-Venue Analytics
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Turn Group Data Into Group Decisions
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Multi-Venue Analytics reveals cross-location patterns, performance trends, and operational insights - helping hospitality groups scale consistency and excellence.
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
                {/* Multi-Venue Analytics Mockup */}
                <div className="bg-white rounded-lg p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <span className="text-gray-900 text-sm font-medium">Group Analytics</span>
                    <span className="text-gray-400 text-xs">This Month</span>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-[#4E74FF]/10 rounded-lg p-2 text-center">
                      <p className="text-[#4E74FF] text-lg font-bold">4.5</p>
                      <p className="text-gray-500 text-[10px]">Avg Rating</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                      <p className="text-emerald-600 text-lg font-bold">+12%</p>
                      <p className="text-gray-500 text-[10px]">vs Last Month</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center">
                      <p className="text-amber-600 text-lg font-bold">847</p>
                      <p className="text-gray-500 text-[10px]">Responses</p>
                    </div>
                  </div>

                  {/* Comparison Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Service</span>
                        <span className="text-gray-900 font-medium">4.7</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-[#4E74FF] h-2 rounded-full" style={{width: '94%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Food Quality</span>
                        <span className="text-gray-900 font-medium">4.5</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-[#4E74FF] h-2 rounded-full" style={{width: '90%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Wait Time</span>
                        <span className="text-gray-900 font-medium">4.1</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{width: '82%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Ambience</span>
                        <span className="text-gray-900 font-medium">4.6</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-[#4E74FF] h-2 rounded-full" style={{width: '92%'}}></div>
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

// SECTION 2 - THE PROBLEM
const Problem = () => {
  const items = [
    'Each location',
    "Each manager's phone",
    'Each shift',
    'Each spreadsheet',
  ];

  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            The Problem: Venue Data Stays Siloed
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Individual venue feedback is useful. But patterns across multiple venues are powerful - and most operators never see them.
            </p>

            <p>
              Why? Because data stays trapped in:
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
              Multi-Venue Analytics connects the dots automatically - so you see the truth across your entire operation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 - WHAT IT REVEALS
const WhatItReveals = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Cross-venue comparisons',
      description: 'Spot your highest and lowest performers instantly.'
    },
    {
      icon: PieChart,
      title: 'Category insight',
      description: 'Service, food, drinks, ambience - by venue.'
    },
    {
      icon: TrendingUp,
      title: 'Trend behaviour over time',
      description: 'See where performance is rising or slipping.'
    },
    {
      icon: Users,
      title: 'Regional & area leader visibility',
      description: 'Give leadership the clarity they need.'
    },
    {
      icon: Building2,
      title: 'Group-wide performance drivers',
      description: "Understand what's working - and replicate it."
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Multi-Venue Analytics Reveals
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

// SECTION 4 - HOW IT WORKS
const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      title: 'Each venue collects feedback normally',
      description: 'No extra work required.',
    },
    {
      number: '2',
      title: 'Chatters pulls everything into a group-level view',
      description: 'One dashboard, complete clarity.',
    },
    {
      number: '3',
      title: 'Trends are highlighted automatically',
      description: 'No manual spreadsheet work.',
    },
    {
      number: '4',
      title: 'Teams take data-driven action',
      description: 'Support weak venues, scale strong ones.',
    },
    {
      number: '5',
      title: 'Operators make better decisions',
      description: 'Smart insights → smart management.',
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

// SECTION 5 - WHY OPERATORS DEPEND ON IT
const WhyOperators = () => {
  const benefits = [
    {
      title: 'Scale best practices',
      description: 'What works in one venue can work across all.',
    },
    {
      title: 'Fix recurring issues quickly',
      description: 'Spot patterns early.',
    },
    {
      title: 'Improve consistency',
      description: 'Guests expect the same standard everywhere.',
    },
    {
      title: 'Make informed staffing decisions',
      description: 'Data → smarter resource allocation.',
    },
    {
      title: 'Strengthen leadership',
      description: 'Give managers clarity and confidence.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Depend on Multi-Venue Analytics
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

// SECTION 6 - FEATURES
const Features = () => {
  const features = [
    {
      icon: Grid3X3,
      title: 'Cross-Venue Comparison Grid',
      description: 'Everything side-by-side.',
    },
    {
      icon: PieChart,
      title: 'Category Analysis',
      description: 'Know which venues excel in food, service, drinks, ambience.',
    },
    {
      icon: LineChart,
      title: 'Performance Trends',
      description: 'Visualise improvement or decline.',
    },
    {
      icon: Users,
      title: 'Regional & Area Manager Modes',
      description: 'Perfect for portfolio oversight.',
    },
    {
      icon: Download,
      title: 'Exportable Reports',
      description: 'Ideal for leadership meetings.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Features Built for Group-Level Insight
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

// SECTION 7 - IN ACTION
const InAction = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Multi-Venue Analytics in Action
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A hospitality group sees inconsistent ratings across locations.
            </p>

            <p className="text-lg text-gray-700">
              Analytics reveals:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• Two venues with slow service during lunch</p>
              <p className="text-gray-700">• One venue with standout friendliness</p>
              <p className="text-gray-700">• One venue with repeated food accuracy issues</p>
            </div>

            <p className="text-lg text-gray-700">
              The operator:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• Sends support to the slow venues</p>
              <p className="text-gray-700">• Highlights the "friendly" venue as a model</p>
              <p className="text-gray-700">• Works with the kitchen team on accuracy</p>
            </div>

            <p className="text-lg text-gray-700">
              A guest later leaves:
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Visited two branches - both excellent. Love how consistent they are."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 8 - TESTIMONIAL
const Testimonial = () => {
  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-2xl sm:text-3xl text-gray-700 italic mb-8 leading-relaxed">
            "For the first time, we have a clear, reliable view across all our venues. It's transformed how we run the group."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">H</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Hannah Patel</p>
              <p className="text-gray-600">Head of Ops, Northfield Hospitality Group</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 9 - FINAL CTA
const FinalCTA = () => {
  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-10">
            See the patterns. Make the changes. Scale what works.
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
const MultiVenueAnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Multi-Venue Analytics | Cross-Location Performance Insights | Chatters</title>
        <meta
          name="description"
          content="Turn group data into group decisions. Multi-Venue Analytics reveals cross-location patterns, performance trends, and operational insights for hospitality groups."
        />
        <meta
          name="keywords"
          content="multi-venue analytics, cross-location analytics, hospitality group insights, restaurant chain analytics, performance patterns, group reporting"
        />
        <meta property="og:title" content="Multi-Venue Analytics | Chatters" />
        <meta property="og:description" content="Turn group data into group decisions. Cross-location patterns and performance insights." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/multi-venue/analytics" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <WhatItReveals />
      <HowItWorks />
      <WhyOperators />
      <Features />
      <InAction />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default MultiVenueAnalyticsPage;
