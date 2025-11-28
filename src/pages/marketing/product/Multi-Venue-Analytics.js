import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  Building2,
  BarChart3,
  TrendingUp,
  GitCompare,
  Check,
  Map,
  Target,
  LineChart,
  Layers
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
              Multi-Venue Analytics
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Compare Every Venue. Spot Every Trend.
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              See how each location is performing side-by-side — ratings, response times, and guest sentiment across your entire portfolio.
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
                  src="https://placehold.co/550x400/e2e8f0/475569?text=Multi-Venue+Analytics"
                  alt="Multi-venue analytics dashboard comparing locations"
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
            Running Multiple Sites Without Visibility Is Risky
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              When you operate more than one venue, it's easy for problems to hide.
              <br />
              One site might be struggling — but you won't know until it's too late.
            </p>

            <p className="text-white font-semibold text-2xl">
              You need a bird's-eye view of every location, every day.
            </p>

            <p>
              Multi-Venue Analytics gives you that — so you can spot issues, share best practices, and raise the bar everywhere.
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
    { icon: GitCompare, text: 'Side-by-side venue comparisons' },
    { icon: TrendingUp, text: 'Performance trends per location' },
    { icon: Star, text: 'Average ratings by venue' },
    { icon: BarChart3, text: 'Response time benchmarks' },
    { icon: Map, text: 'Regional and group-level views' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Your Entire Portfolio at a Glance
            </h2>
            <p className="text-lg text-gray-600">
              See everything. Miss nothing.
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
            One dashboard. Every venue. Complete clarity.
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
      title: 'Connect all your venues',
      description: 'Each location feeds into one central dashboard.',
    },
    {
      number: '2',
      title: 'View the portfolio summary',
      description: 'See all venues ranked by key metrics.',
    },
    {
      number: '3',
      title: 'Drill into any location',
      description: 'Click through for venue-specific detail.',
    },
    {
      number: '4',
      title: 'Compare side by side',
      description: 'Select venues to see performance differences.',
    },
    {
      number: '5',
      title: 'Spot trends and outliers',
      description: 'Identify which sites are improving — and which need help.',
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
      title: 'Catch problems early',
      description: 'See when a venue's ratings start to slip.',
    },
    {
      title: 'Share best practices',
      description: 'Learn what's working at your top sites.',
    },
    {
      title: 'Allocate resources smarter',
      description: 'Focus support where it's needed most.',
    },
    {
      title: 'Drive healthy competition',
      description: 'Let venues see how they stack up.',
    },
    {
      title: 'Report to stakeholders',
      description: 'Show performance across the portfolio with confidence.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Multi-Venue Analytics Matters
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
      icon: Layers,
      title: 'Portfolio Overview',
      description: 'All venues ranked on one screen.',
    },
    {
      icon: LineChart,
      title: 'Trend Charts',
      description: 'See performance changes over time.',
    },
    {
      icon: Target,
      title: 'Benchmarking',
      description: 'Compare against group averages.',
    },
    {
      icon: Building2,
      title: 'Regional Grouping',
      description: 'Organise by region, brand, or manager.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Multi-Site Operators
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
              Portfolio Intelligence in Action
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              An operations director opens the Multi-Venue Analytics dashboard on Monday morning. Eight venues are displayed in a ranked list:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• <span className="font-semibold">The Grove</span> — 4.8 avg rating, 1:45 response time</p>
              <p className="text-gray-700">• <span className="font-semibold">The Waterside</span> — 4.6 avg rating, 2:10 response time</p>
              <p className="text-gray-700">• <span className="font-semibold">Market Square</span> — 4.5 avg rating, 2:30 response time</p>
              <p className="text-gray-700">• ...</p>
              <p className="text-red-600">• <span className="font-semibold">The Old Mill</span> — 3.9 avg rating, 4:15 response time ⚠️</p>
            </div>

            <p className="text-lg text-gray-700">
              The Old Mill stands out. The director drills in and sees response times have doubled over two weeks. A call to the GM reveals a staffing gap on weekends.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                Two weeks later, after adding weekend cover:
              </p>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4].map((star) => (
                  <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              </div>

              <p className="text-lg text-gray-800 italic">
                The Old Mill — 4.4 avg rating, 2:05 response time ✓
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 text-center">
              That insight would have been invisible without cross-venue comparison.
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
            "Multi-Venue Analytics gives me the visibility I need to run 12 sites without surprises. I can see problems before they hit reviews."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">J</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">James Fletcher</p>
              <p className="text-gray-600">COO, The Dining Collective</p>
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
            One portfolio. One dashboard. Total visibility.
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
const MultiVenueAnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Multi-Venue Analytics | Cross-Location Performance | Chatters</title>
        <meta
          name="description"
          content="Compare every venue. Spot every trend. See how each location is performing side-by-side with ratings, response times, and guest sentiment across your portfolio."
        />
        <meta
          name="keywords"
          content="multi-venue analytics, multi-location reporting, hospitality portfolio, cross-venue comparison, restaurant group analytics, hotel chain performance"
        />
        <meta property="og:title" content="Multi-Venue Analytics | Chatters" />
        <meta property="og:description" content="Compare every venue. Spot every trend. Cross-location performance analytics." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/multi-venue-analytics" />
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

export default MultiVenueAnalyticsPage;
