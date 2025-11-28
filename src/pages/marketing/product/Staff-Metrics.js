import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  BarChart3,
  Users,
  TrendingUp,
  Clock,
  Check,
  Target,
  Award,
  FileText,
  Calendar
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
              Staff Metrics & Reporting
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Measure What Matters About Your Team
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Track individual and team performance with detailed metrics — response times, guest ratings, and recognition trends all in one place.
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
                  src="https://placehold.co/550x400/e2e8f0/475569?text=Staff+Metrics+Dashboard"
                  alt="Staff metrics dashboard showing team performance"
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
            You Can't Improve What You Can't Measure
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Most hospitality teams run on gut feel.
              <br />
              Who's performing well? Who needs support? It's hard to say with confidence.
            </p>

            <p className="text-white font-semibold text-2xl">
              Data-driven teams consistently outperform.
            </p>

            <p>
              Staff Metrics gives you the numbers behind the service — so you can coach, reward, and improve with clarity.
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
    { icon: Star, text: 'Individual guest rating averages' },
    { icon: Clock, text: 'Response time to alerts and requests' },
    { icon: Award, text: 'Recognition count per staff member' },
    { icon: TrendingUp, text: 'Performance trends over time' },
    { icon: Users, text: 'Team comparisons and benchmarks' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Understand Performance
            </h2>
            <p className="text-lg text-gray-600">
              Metrics that matter for hospitality teams.
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
            From gut feel to real insight.
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
      title: 'Add your team to Chatters',
      description: "Names, roles, and email addresses — that's it.",
    },
    {
      number: '2',
      title: 'Feedback starts tracking automatically',
      description: 'Every guest interaction is attributed to the right person.',
    },
    {
      number: '3',
      title: 'View individual dashboards',
      description: 'See ratings, response times, and recognition for each team member.',
    },
    {
      number: '4',
      title: 'Compare across the team',
      description: 'Identify top performers and those who need support.',
    },
    {
      number: '5',
      title: 'Export reports for reviews',
      description: 'Use real data in 1:1s and performance conversations.',
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
      title: 'Fair performance reviews',
      description: 'Base conversations on data, not assumptions.',
    },
    {
      title: 'Identify training needs',
      description: 'Spot who needs coaching before issues escalate.',
    },
    {
      title: 'Reward top performers',
      description: 'Recognition backed by real numbers.',
    },
    {
      title: 'Improve service consistency',
      description: 'Raise the floor by understanding the gaps.',
    },
    {
      title: 'Reduce turnover',
      description: 'Staff who feel seen and supported stay longer.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Staff Metrics Matter
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
      description: 'Clean charts that tell the story at a glance.',
    },
    {
      icon: Calendar,
      title: 'Date Range Filters',
      description: 'Compare week over week, month over month.',
    },
    {
      icon: FileText,
      title: 'Exportable Reports',
      description: 'Download data for reviews and meetings.',
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Set targets and track progress over time.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for People Managers
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
              Data-Driven Conversations
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              It's time for monthly 1:1s. The manager opens Staff Metrics and pulls up Tom's dashboard:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• Average rating: 4.7 stars (up from 4.4 last month)</p>
              <p className="text-gray-700">• Response time to alerts: 2 min 15 sec</p>
              <p className="text-gray-700">• Guest recognitions this month: 8</p>
              <p className="text-gray-700">• Tables served: 142</p>
            </div>

            <p className="text-lg text-gray-700">
              The conversation starts with facts, not feelings. Tom sees exactly where he's excelling — and where he can grow.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                The manager says:
              </p>

              <p className="text-lg text-gray-800 italic">
                "Tom, your ratings have jumped this month, and guests are mentioning you by name more than anyone else. Let's talk about what's working."
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 text-center">
              That's a performance review worth having.
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
            "Staff Metrics changed how we run reviews. We finally have real numbers to back up what we've always felt."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">A</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Alex Morrison</p>
              <p className="text-gray-600">Head of People, The Foundry Group</p>
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
            Better data. Better teams. Better service.
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
const StaffMetricsPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Staff Metrics & Reporting | Team Performance Analytics | Chatters</title>
        <meta
          name="description"
          content="Measure what matters about your team. Track individual and team performance with detailed metrics — response times, guest ratings, and recognition trends."
        />
        <meta
          name="keywords"
          content="staff metrics, team performance, hospitality analytics, employee performance, staff reporting, response time tracking, performance management"
        />
        <meta property="og:title" content="Staff Metrics & Reporting | Chatters" />
        <meta property="og:description" content="Measure what matters about your team. Detailed performance metrics for hospitality." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/staff-metrics" />
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

export default StaffMetricsPage;
