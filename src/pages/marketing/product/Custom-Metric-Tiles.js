import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  LayoutDashboard,
  Building2,
  Users,
  Layers,
  TrendingUp,
  Check,
  Target,
  Sliders
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
              Custom Metric Tiles
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Build the Dashboard That Matches How You Operate
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Custom Metric Tiles let you track the metrics that matter most to your venues — from service speed and cleanliness to food accuracy and guest satisfaction.
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
                <img
                  src="https://placehold.co/550x400/e2e8f0/475569?text=Custom+Metric+Tiles"
                  alt="Custom metric tiles dashboard"
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
  const items = [
    'A pub focuses on ambience',
    'A hotel bar cares about service speed',
    'A restaurant cares about food accuracy',
    'A food hall cares about table turnover',
    'Groups care about consistency',
  ];

  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            The Problem: Every Venue Operates Differently
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Most dashboards assume every venue works the same way. But:
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
              One-size-fits-all dashboards don't work.
            </p>

            <p>
              Custom Metric Tiles let you build dashboards that reflect your real-world priorities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — WHAT YOU CAN TRACK
const WhatYouTrack = () => {
  const features = [
    {
      icon: Target,
      title: 'Your most important metrics',
      description: 'Speed, friendliness, accuracy, cleanliness — whatever drives your venue.'
    },
    {
      icon: Building2,
      title: 'Venue-specific priorities',
      description: "Each site can focus on what's relevant to them."
    },
    {
      icon: Layers,
      title: 'Service category breakdowns',
      description: 'Food, drink, service, ambience, experience.'
    },
    {
      icon: TrendingUp,
      title: 'Real-time trend tracking',
      description: 'See improvement (or decline) instantly.'
    },
    {
      icon: Users,
      title: 'Multi-venue metric alignment',
      description: 'Create shared standards across your group.'
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Custom Metrics Let You Track
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
      title: 'Choose the metrics that matter',
      description: 'Select from proven hospitality measures or create your own.',
    },
    {
      number: '2',
      title: 'Build your dashboard visually',
      description: 'Drag tiles to create layouts per venue or group.',
    },
    {
      number: '3',
      title: 'Metrics update live',
      description: 'Tiles refresh instantly with new guest feedback.',
    },
    {
      number: '4',
      title: 'Compare across venues',
      description: 'Spot strengths and weaknesses in seconds.',
    },
    {
      number: '5',
      title: 'Adjust anytime',
      description: 'Season, menu changes, events, new management — everything adapts.',
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
      title: 'Make performance clear and actionable',
      description: 'Teams understand exactly what success looks like.',
    },
    {
      title: 'Empower managers',
      description: 'Dashboards that match their operation.',
    },
    {
      title: 'Remove noise',
      description: 'Focus on what matters — nothing more.',
    },
    {
      title: 'Excellent for multi-venue rollout',
      description: 'Consistent standards across every site.',
    },
    {
      title: 'Turn metrics into meaningful discussions',
      description: 'Perfect for weekly meetings.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Depend on Custom Metric Tiles
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
      icon: LayoutDashboard,
      title: 'Live Metric Tiles',
      description: 'Visual clarity for service, speed, friendliness, accuracy, and more.',
    },
    {
      icon: Building2,
      title: 'Venue-Specific Dashboards',
      description: "Each site sees what's relevant to them.",
    },
    {
      icon: Users,
      title: 'Group Leadership Mode',
      description: 'Compare metrics across multiple venues.',
    },
    {
      icon: Layers,
      title: 'Category Breakdown Filters',
      description: 'Food, service, drinks, ambience, overall.',
    },
    {
      icon: TrendingUp,
      title: 'Trend Direction Arrows',
      description: 'Instant clarity on improvement or decline.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Hospitality Performance
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
              Custom Metrics in Action
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A restaurant group launches a new seasonal menu.
            </p>

            <p className="text-lg text-gray-700">
              They add metric tiles for:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• Food accuracy</p>
              <p className="text-gray-700">• Serving temperature</p>
              <p className="text-gray-700">• Wait time</p>
              <p className="text-gray-700">• Taste satisfaction</p>
            </div>

            <p className="text-lg text-gray-700">
              Within days, the tiles show:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• One venue slow on mains</p>
              <p className="text-gray-700">• One venue consistently praised for flavour</p>
              <p className="text-gray-700">• One venue inconsistent during peak hours</p>
            </div>

            <p className="text-lg text-gray-700">
              Teams adjust. Performance stabilises.
            </p>

            <p className="text-lg text-gray-700">
              A new review appears:
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Seasonal menu was amazing — everything came out hot and fast. Really impressed."
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
            "We finally have dashboards that match how our venues actually operate. It's made team performance conversations so much easier."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">S</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Sarah Kent</p>
              <p className="text-gray-600">Operations Director, The Urban Fork Group</p>
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
            Track what matters. Improve what counts.
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
const CustomMetricTilesPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Custom Metric Tiles | Build Your Own Dashboard | Chatters</title>
        <meta
          name="description"
          content="Build the dashboard that matches how you operate. Custom Metric Tiles let you track the metrics that matter most to your venues — from service speed to guest satisfaction."
        />
        <meta
          name="keywords"
          content="custom metrics, dashboard tiles, hospitality metrics, venue performance, custom dashboard, performance tracking"
        />
        <meta property="og:title" content="Custom Metric Tiles | Chatters" />
        <meta property="og:description" content="Build the dashboard that matches how you operate. Track what matters most." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/multi-venue/metrics" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <WhatYouTrack />
      <HowItWorks />
      <WhyOperators />
      <Features />
      <InAction />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default CustomMetricTilesPage;
