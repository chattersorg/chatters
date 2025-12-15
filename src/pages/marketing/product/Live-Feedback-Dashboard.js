import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  LayoutDashboard,
  Clock,
  Filter,
  Search,
  Check,
  BarChart3,
  Eye,
  Bell,
  RefreshCw
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
              Live Feedback Dashboard
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Every Guest. Every Comment. One View.
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              A real-time stream of all feedback across your venue - filterable, searchable, and always up to date.
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
                {/* Live Dashboard Mockup */}
                <div className="bg-white rounded-lg p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-900 text-sm font-medium">Live Feed</span>
                    </div>
                    <span className="text-gray-400 text-xs">12 today</span>
                  </div>

                  {/* Feedback Items */}
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 text-xs font-medium">Table 4</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= 5 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs">Amazing service tonight!</p>
                      <span className="text-gray-400 text-[10px]">2 min ago</span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 text-xs font-medium">Table 9</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs">Food was great, bit of a wait</p>
                      <span className="text-gray-400 text-[10px]">8 min ago</span>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 text-xs font-medium">Table 7</span>
                          <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded">Alert</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= 2 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs">Still waiting for drinks</p>
                      <span className="text-gray-400 text-[10px]">12 min ago</span>
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
  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            Feedback Shouldn't Live in Spreadsheets
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Most feedback systems bury insights in reports you'll never open.
              <br />
              By the time you see them, the moment's gone.
            </p>

            <p className="text-white font-semibold text-2xl">
              Your team needs visibility - not another dashboard to ignore.
            </p>

            <p>
              The Live Feedback Dashboard puts every guest comment front and centre, the moment it arrives.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 - WHAT YOU GET
const WhatYouGet = () => {
  const features = [
    { icon: RefreshCw, text: 'Real-time feed of all incoming feedback' },
    { icon: Filter, text: 'Filter by rating, date, table, or staff member' },
    { icon: Search, text: 'Search comments instantly' },
    { icon: Eye, text: 'See resolved vs unresolved at a glance' },
    { icon: Bell, text: 'Jump straight to alerts that need attention' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Stay Informed
            </h2>
            <p className="text-lg text-gray-600">
              The dashboard gives you complete visibility into guest sentiment.
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {features.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-[#4E74FF]/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-[#4E74FF]" />
                </div>
                <span className="text-lg text-gray-900 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-xl font-bold text-gray-900">
            No more digging. No more delays. Just clarity.
          </p>
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
      title: 'Guest submits feedback',
      description: 'Via QR code at their table - takes 30 seconds.',
    },
    {
      number: '2',
      title: 'Feedback appears instantly',
      description: 'On your Live Dashboard with full context.',
    },
    {
      number: '3',
      title: 'Filter and search as needed',
      description: 'Find specific comments, tables, or time periods.',
    },
    {
      number: '4',
      title: 'Take action or mark resolved',
      description: "Keep your team aligned on what's been handled.",
    },
    {
      number: '5',
      title: 'Track trends over time',
      description: 'Spot patterns in feedback to improve operations.',
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

// SECTION 5 - WHY OPERATORS LOVE IT
const WhyOperators = () => {
  const benefits = [
    {
      title: 'Instant awareness',
      description: 'Know what guests are saying the moment they say it.',
    },
    {
      title: 'Better shift handovers',
      description: "Incoming managers can scan the day's feedback in seconds.",
    },
    {
      title: 'Faster resolution',
      description: 'Jump from feedback to action without leaving the screen.',
    },
    {
      title: 'Team accountability',
      description: "See who's handling what - and how quickly.",
    },
    {
      title: 'Informed decisions',
      description: 'Spot recurring issues before they become crises.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Love the Live Dashboard
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
      icon: LayoutDashboard,
      title: 'Clean Interface',
      description: 'No clutter - just the information that matters.',
    },
    {
      icon: Clock,
      title: 'Time Stamps',
      description: 'See exactly when each piece of feedback arrived.',
    },
    {
      icon: Filter,
      title: 'Smart Filters',
      description: 'Slice data by rating, staff, table, or keyword.',
    },
    {
      icon: BarChart3,
      title: 'Trend Insights',
      description: 'Spot patterns across days, weeks, or months.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Daily Operations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

// SECTION 7 - REAL EXAMPLE
const RealExample = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              A Day in the Dashboard
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              It's 6pm. The evening shift manager opens the Live Dashboard. In seconds, they see:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• 12 new feedback submissions since lunch</p>
              <p className="text-gray-700">• 2 flagged as low ratings (already resolved)</p>
              <p className="text-gray-700">• 1 assistance request still pending</p>
              <p className="text-gray-700">• Average rating for the day: 4.6 stars</p>
            </div>

            <p className="text-lg text-gray-700">
              They tap the pending request, see it's a table asking for their bill, and radio the floor team. Sorted in 30 seconds.
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                At closing, the GM reviews the dashboard:
              </p>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Great service tonight - everyone was on it. Dashboard showed no unresolved alerts."
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 text-center">
              That's the power of real-time visibility.
            </p>
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
            "The Live Dashboard is the first thing I check when I arrive. It tells me everything I need to know about the day so far."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">M</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Marcus Chen</p>
              <p className="text-gray-600">Operations Manager, The Grove</p>
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
            Stop guessing. Start seeing.
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
const LiveFeedbackDashboardPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Live Feedback Dashboard | Real-Time Guest Comments | Chatters</title>
        <meta
          name="description"
          content="Every guest. Every comment. One view. The Live Feedback Dashboard gives you real-time visibility into all guest feedback - filterable, searchable, and always up to date."
        />
        <meta
          name="keywords"
          content="live feedback dashboard, real-time feedback, guest comments, feedback management, hospitality dashboard, customer feedback view"
        />
        <meta property="og:title" content="Live Feedback Dashboard | Chatters" />
        <meta property="og:description" content="Every guest. Every comment. One view. Real-time visibility into all guest feedback." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/live-feedback-dashboard" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <WhatYouGet />
      <HowItWorks />
      <WhyOperators />
      <Features />
      <RealExample />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default LiveFeedbackDashboardPage;
