import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  TrendingUp,
  Calendar,
  Search,
  Clock,
  Check,
  BarChart3,
  PieChart,
  LineChart,
  Lightbulb
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
            <p className="text-sm font-semibold uppercase tracking-wide text-[#41C74E] mb-4">
              Customer Trends
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              See Patterns Before They Become Problems
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Analyse feedback over time to spot emerging issues, seasonal shifts, and improvement opportunities — before they hit your reviews.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/try"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#41C74E] rounded-lg hover:bg-[#38b043] transition-all duration-200 shadow-lg hover:shadow-xl"
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
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <img
                  src="https://placehold.co/550x400/e2e8f0/475569?text=Customer+Trends+Charts"
                  alt="Customer trends dashboard showing feedback patterns"
                  className="w-full rounded-lg"
                />
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
  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            Individual Feedback Only Tells Part of the Story
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              A single comment about slow service is easy to dismiss.
              <br />
              But if 20 guests mention it over two weeks? That's a pattern.
            </p>

            <p className="text-white font-semibold text-2xl">
              The real insights live in the trends — not the one-offs.
            </p>

            <p>
              Customer Trends helps you zoom out, see the bigger picture, and act before small issues become big problems.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — WHAT YOU GET
const WhatYouGet = () => {
  const features = [
    { icon: LineChart, text: 'Rating trends over time' },
    { icon: PieChart, text: 'Sentiment breakdown by category' },
    { icon: Calendar, text: 'Day-of-week and time-of-day patterns' },
    { icon: Search, text: 'Keyword frequency analysis' },
    { icon: TrendingUp, text: 'Improvement tracking month-over-month' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Turn Feedback Into Foresight
            </h2>
            <p className="text-lg text-gray-600">
              See what's changing — and why.
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {features.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-[#41C74E]/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-[#41C74E]" />
                </div>
                <span className="text-lg text-gray-900 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-xl font-bold text-gray-900">
            From reactive to proactive. From guessing to knowing.
          </p>
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
      title: 'Feedback accumulates automatically',
      description: 'Every guest comment feeds into your trends engine.',
    },
    {
      number: '2',
      title: 'Chatters analyses patterns',
      description: 'AI identifies recurring themes and shifts over time.',
    },
    {
      number: '3',
      title: 'Trends surface in your dashboard',
      description: 'See charts, keywords, and sentiment changes at a glance.',
    },
    {
      number: '4',
      title: 'Filter by date range',
      description: 'Compare this week to last, or this month to same time last year.',
    },
    {
      number: '5',
      title: 'Take informed action',
      description: 'Address root causes, not symptoms.',
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
                <div className="flex-shrink-0 w-12 h-12 bg-[#41C74E] rounded-full flex items-center justify-center text-white font-bold text-lg z-10">
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

// SECTION 5 — WHY IT MATTERS
const WhyItMatters = () => {
  const benefits = [
    {
      title: 'Catch issues early',
      description: "Spot problems when they're small and fixable.",
    },
    {
      title: 'Understand seasonality',
      description: 'See how feedback shifts with busy periods.',
    },
    {
      title: 'Measure improvement',
      description: 'Track whether changes are making a difference.',
    },
    {
      title: 'Prioritise with confidence',
      description: 'Focus on what guests mention most often.',
    },
    {
      title: 'Report with clarity',
      description: 'Show stakeholders real trends, not anecdotes.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Customer Trends Matter
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex gap-4 items-start bg-gray-50 rounded-xl p-6"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-[#41C74E] rounded-full flex items-center justify-center">
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
      icon: BarChart3,
      title: 'Visual Dashboards',
      description: 'Charts that make patterns obvious.',
    },
    {
      icon: Clock,
      title: 'Time Comparisons',
      description: 'This week vs last, this month vs last year.',
    },
    {
      icon: Search,
      title: 'Keyword Tracking',
      description: 'See which words appear most in feedback.',
    },
    {
      icon: Lightbulb,
      title: 'AI Insights',
      description: 'Automated suggestions based on trends.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Strategic Operators
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#41C74E]/50 hover:shadow-md transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#41C74E]/10 rounded-xl mb-4">
                <feature.icon className="w-7 h-7 text-[#41C74E]" />
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

// SECTION 7 — REAL EXAMPLE
const RealExample = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Spotting a Problem Before It Hits Reviews
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A restaurant manager notices something in Customer Trends: the word "cold" has appeared in 15 comments over the past two weeks — up from just 2 the month before.
            </p>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl">
              <p className="text-lg text-gray-800">
                <span className="font-semibold">Trending keyword:</span> "cold"
                <br />
                <span className="text-sm text-gray-600">15 mentions in last 14 days (+650%)</span>
              </p>
            </div>

            <p className="text-lg text-gray-700">
              They investigate and find the kitchen's heat lamp has been malfunctioning. It's fixed within a day.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                Two weeks later:
              </p>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Food arrived hot and delicious. Best steak I've had in ages."
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 text-center">
              Without trend analysis, that issue could have festered for months.
            </p>
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
            "Customer Trends showed us that weekend brunch service was slipping — something we'd completely missed in day-to-day feedback. We fixed it before a single bad review."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">L</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Laura Bennett</p>
              <p className="text-gray-600">Owner, The Corner Bistro</p>
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
            Stop reacting. Start anticipating.
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/try"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#41C74E] rounded-lg hover:bg-[#38b043] transition-all duration-200 shadow-lg hover:shadow-xl"
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
const CustomerTrendsPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Customer Trends | Feedback Pattern Analysis | Chatters</title>
        <meta
          name="description"
          content="See patterns before they become problems. Analyse feedback over time to spot emerging issues, seasonal shifts, and improvement opportunities."
        />
        <meta
          name="keywords"
          content="customer trends, feedback analysis, sentiment trends, hospitality analytics, feedback patterns, customer insights, trend analysis"
        />
        <meta property="og:title" content="Customer Trends | Chatters" />
        <meta property="og:description" content="See patterns before they become problems. Feedback trend analysis for hospitality." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/customer-trends" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <WhatYouGet />
      <HowItWorks />
      <WhyItMatters />
      <Features />
      <RealExample />
      <Testimonial />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default CustomerTrendsPage;
