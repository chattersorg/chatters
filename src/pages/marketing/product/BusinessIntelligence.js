import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  LineChart,
  PieChart,
  Award,
  TrendingUp,
  Download,
  Check,
  Calendar,
  BarChart3
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
              Business Intelligence
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Turn Service Data Into Strategic Decisions
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Business Intelligence gives operators historical trends, comparative insights, and long-term performance patterns — ideal for planning, reporting, and leadership decisions.
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
                {/* Business Intelligence Mockup */}
                <div className="bg-white rounded-lg p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#4E74FF]" />
                      <span className="text-gray-900 text-sm font-medium">Business Intelligence</span>
                    </div>
                    <span className="text-gray-400 text-xs">Q4 2024</span>
                  </div>

                  {/* Trend Chart */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 text-xs">Rating Trend</span>
                      <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +0.4
                      </span>
                    </div>
                    <div className="flex items-end justify-between h-16 gap-1">
                      {[4.1, 4.2, 4.1, 4.3, 4.4, 4.3, 4.5, 4.6, 4.5, 4.6, 4.7, 4.5].map((v, i) => (
                        <div key={i} className="flex-1 bg-[#4E74FF] rounded-t opacity-60 hover:opacity-100 transition-opacity" style={{height: `${(v/5)*100}%`}}></div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-400 text-[10px]">Oct</span>
                      <span className="text-gray-400 text-[10px]">Nov</span>
                      <span className="text-gray-400 text-[10px]">Dec</span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-[10px] mb-1">Avg Response</p>
                      <p className="text-gray-900 text-sm font-bold">52s</p>
                      <span className="text-emerald-600 text-[10px]">-8s vs last quarter</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-[10px] mb-1">Issues Resolved</p>
                      <p className="text-gray-900 text-sm font-bold">94%</p>
                      <span className="text-emerald-600 text-[10px]">+6% vs last quarter</span>
                    </div>
                  </div>

                  {/* Export Button */}
                  <button className="w-full bg-gray-100 hover:bg-gray-200 rounded-lg py-2 flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-600 text-xs font-medium">Export Report</span>
                  </button>
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
    'How has service changed over the last month?',
    'Which improvements made a difference?',
    'Are issues seasonal or constant?',
    'Which venues are improving fastest?',
    'Where should training budget go?',
  ];

  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            The Problem: Most Decisions Are Based on Snapshots, Not Trends
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Daily service feedback is useful. But strategy requires time:
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
              Without long-term analysis, decisions rely on instinct — not truth.
            </p>

            <p>
              Business Intelligence provides the bigger picture.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — WHAT IT REVEALS
const WhatItReveals = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Month-to-month performance changes',
      description: 'Understand long-term improvements or declines.'
    },
    {
      icon: PieChart,
      title: 'Category performance over time',
      description: 'Service, food, drinks, ambience — historically tracked.'
    },
    {
      icon: BarChart3,
      title: 'Menu and product trends',
      description: 'See which items consistently cause issues.'
    },
    {
      icon: TrendingUp,
      title: 'Staff-level improvement (over weeks)',
      description: 'Track development, not daily fluctuation.'
    },
    {
      icon: Award,
      title: 'Venue benchmarking (historical)',
      description: 'Rank locations based on long-term data.'
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Business Intelligence Reveals
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
      title: 'Feedback is aggregated across weeks and months',
      description: 'You see the story over time.',
    },
    {
      number: '2',
      title: 'Data is segmented automatically',
      description: 'By category, venue, hour, shift, or week.',
    },
    {
      number: '3',
      title: 'Trends visualised clearly',
      description: 'Graphs, charts, and summaries.',
    },
    {
      number: '4',
      title: 'Insights used for planning',
      description: 'Training, staffing, menu design, budgets.',
    },
    {
      number: '5',
      title: 'Strategic improvements trackable',
      description: 'Measure if initiatives are working.',
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
      title: 'Better forecasting',
      description: 'Plan staff, training, and resources with confidence.',
    },
    {
      title: 'Smarter menu decisions',
      description: 'Identify dishes that consistently cause issues.',
    },
    {
      title: 'Stronger leadership conversations',
      description: 'Show real improvement — or decline — with evidence.',
    },
    {
      title: 'Better investment decisions',
      description: 'Spend time and budget where impact will be highest.',
    },
    {
      title: 'Clear performance narrative',
      description: 'Easy to share with owners, boards, and senior staff.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Depend on Business Intelligence
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
      icon: LineChart,
      title: 'Multi-Week Trend Graphs',
      description: 'Month-by-month shifts.',
    },
    {
      icon: PieChart,
      title: 'Category Impact Analysis',
      description: 'Which areas most affect ratings.',
    },
    {
      icon: Award,
      title: 'Venue Benchmark Reports',
      description: 'Rank venues over time.',
    },
    {
      icon: TrendingUp,
      title: 'Staff Improvement Tracking',
      description: 'Identify long-term development.',
    },
    {
      icon: Download,
      title: 'Exportable PDFs/CSVs',
      description: 'Perfect for leadership meetings.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Strategic Decision-Making
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
              Business Intelligence in Action
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A regional operations director reviews quarterly BI data:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• Drink speed slowed steadily across 3 months</p>
              <p className="text-gray-700">• Food accuracy improved after a menu refresh</p>
              <p className="text-gray-700">• Service friendliness dipped during winter weekends</p>
              <p className="text-gray-700">• One venue outperformed all others for attentiveness</p>
            </div>

            <p className="text-lg text-gray-700">
              She:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• Schedules a bartending refresher</p>
              <p className="text-gray-700">• Replicates the successful venue's training</p>
              <p className="text-gray-700">• Adjusts winter staffing patterns</p>
            </div>

            <p className="text-lg text-gray-700">
              A month later:
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Service was exceptional this time — the team were on it from start to finish."
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
            "This is the data we use in board meetings now. It's improved decision-making across the group."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">H</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Hannah Patel</p>
              <p className="text-gray-600">Head of Operations, Northfield Hospitality Group</p>
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
            See the bigger picture. Make smarter decisions.
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
const BusinessIntelligencePage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Business Intelligence | Strategic Service Insights | Chatters</title>
        <meta
          name="description"
          content="Turn service data into strategic decisions. Business Intelligence gives operators historical trends, comparative insights, and long-term performance patterns."
        />
        <meta
          name="keywords"
          content="business intelligence, hospitality BI, service analytics, performance trends, strategic insights, hospitality reporting"
        />
        <meta property="og:title" content="Business Intelligence | Chatters" />
        <meta property="og:description" content="Turn service data into strategic decisions. Historical trends and long-term insights." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/analytics/business-intelligence" />
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

export default BusinessIntelligencePage;
