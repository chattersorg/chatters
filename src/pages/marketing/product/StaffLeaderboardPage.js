import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Trophy,
  Award,
  TrendingUp,
  Star,
  Users,
  Check,
  BarChart3,
  Zap,
  Target
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
              Staff Leaderboard
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              See Who's Earning the Love — And Celebrate Them
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              A real-time leaderboard that ranks staff by guest feedback — so you always know who's crushing it.
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
                {/* Staff Leaderboard Mockup */}
                <div className="bg-white rounded-lg p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#4E74FF]" />
                      <span className="text-gray-900 text-sm font-medium">Leaderboard</span>
                    </div>
                    <span className="text-gray-400 text-xs">This Week</span>
                  </div>

                  {/* Top 3 Podium */}
                  <div className="flex items-end justify-center gap-2 mb-4">
                    {/* 2nd Place */}
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-gray-700 text-xs font-medium">TJ</span>
                      </div>
                      <div className="bg-gray-200 rounded-t-lg w-12 h-12 flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-bold">2</span>
                      </div>
                    </div>
                    {/* 1st Place */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1 ring-2 ring-yellow-400">
                        <span className="text-yellow-700 text-sm font-medium">SC</span>
                      </div>
                      <div className="bg-yellow-400 rounded-t-lg w-14 h-16 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-yellow-800" />
                      </div>
                    </div>
                    {/* 3rd Place */}
                    <div className="text-center">
                      <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-amber-700 text-xs font-medium">EW</span>
                      </div>
                      <div className="bg-amber-200 rounded-t-lg w-12 h-10 flex items-center justify-center">
                        <span className="text-amber-700 text-sm font-bold">3</span>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold text-yellow-800">1</span>
                        <span className="text-gray-900 text-xs font-medium">Sarah Chen</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-900 text-xs font-medium">4.9</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">2</span>
                        <span className="text-gray-900 text-xs font-medium">Tom Jones</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-900 text-xs font-medium">4.7</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-700">3</span>
                        <span className="text-gray-900 text-xs font-medium">Emma Wilson</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-900 text-xs font-medium">4.6</span>
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
  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            Great Service Often Goes Unnoticed
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Your staff work hard. Guests notice — and say so.
              <br />
              But unless managers are watching every interaction, praise gets lost in the noise.
            </p>

            <p className="text-white font-semibold text-2xl">
              You shouldn't have to guess who's doing well.
            </p>

            <p>
              The Staff Leaderboard brings visibility to performance — based on real guest feedback, not gut feel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — WHAT THE LEADERBOARD SHOWS
const WhatItShows = () => {
  const features = [
    { icon: Trophy, text: 'Staff ranked by guest ratings and mentions' },
    { icon: Star, text: 'Average star rating per team member' },
    { icon: Award, text: 'Number of recognitions received' },
    { icon: TrendingUp, text: 'Trends over time (weekly, monthly)' },
    { icon: Users, text: 'Comparisons across roles and shifts' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What the Staff Leaderboard Shows
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to celebrate top performers.
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
            Performance you can see — and celebrate.
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
      description: 'Upload staff names, roles, and emails.',
    },
    {
      number: '2',
      title: 'Guest feedback flows in',
      description: 'As guests leave ratings and comments, they get attributed to the right person.',
    },
    {
      number: '3',
      title: 'Leaderboard updates automatically',
      description: 'Rankings adjust in real time based on the latest data.',
    },
    {
      number: '4',
      title: 'Filter by shift, role, or location',
      description: "See who's winning on Friday nights, at brunch, or across all venues.",
    },
    {
      number: '5',
      title: 'Celebrate and coach',
      description: 'Recognise the top performers. Support those who need it.',
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
      title: 'Visibility without micromanaging',
      description: "Know who's performing — without hovering.",
    },
    {
      title: 'Fair recognition based on data',
      description: 'No favouritism. Just feedback.',
    },
    {
      title: 'Motivates healthy competition',
      description: 'Staff strive to top the board.',
    },
    {
      title: 'Supports coaching conversations',
      description: 'Facts, not feelings, in performance reviews.',
    },
    {
      title: 'Works across shifts and locations',
      description: 'Ideal for multi-venue or multi-team setups.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Depend on It
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
      icon: BarChart3,
      title: 'Real-Time Rankings',
      description: 'The leaderboard updates as new feedback comes in.',
    },
    {
      icon: Target,
      title: 'Role & Shift Filters',
      description: 'Compare bartenders to bartenders. Or just the Saturday night crew.',
    },
    {
      icon: Zap,
      title: 'Recognition Highlights',
      description: 'See which staff are being mentioned by name most often.',
    },
    {
      icon: Trophy,
      title: 'Top Performer Badges',
      description: "Visual markers for the week's top-rated team members.",
    },
    {
      icon: TrendingUp,
      title: 'Performance Trends',
      description: "Track who's improving — and who might need support.",
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Features for Hospitality Teams
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
              Staff Leaderboard in Action
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              Amy has been serving tables for three months. She works hard — but does anyone notice?
            </p>

            <p className="text-lg text-gray-700">
              One Friday evening, a guest writes:
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-xl">
              <p className="text-lg text-gray-800 italic">
                "Amy was brilliant — friendly, fast, and made us feel welcome from the moment we sat down."
              </p>
            </div>

            <p className="text-lg text-gray-700">
              By Saturday morning, Amy's jumped to #2 on the weekly leaderboard.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-[#4E74FF] rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <p className="font-bold text-gray-900">Amy</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">4.9 avg</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">12 reviews • 5 recognitions this week</p>
            </div>

            <p className="text-lg text-gray-700">
              The GM sees it in Monday's team huddle. She calls it out:
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-lg text-gray-800 italic">
                "Amy shot up the leaderboard this week — great work! Keep it up."
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 text-center">
              That's the power of visible recognition.
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
            "The leaderboard turned service into a game — in the best way. Our team actually talks about guest feedback now."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">D</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Daniel Price</p>
              <p className="text-gray-600">GM, Riverside Bar & Kitchen</p>
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
            Make great service visible.
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
const StaffLeaderboardPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Staff Leaderboard | Real-Time Team Performance Rankings | Chatters</title>
        <meta
          name="description"
          content="See who's earning the love and celebrate them. A real-time leaderboard that ranks staff by guest feedback — so you always know who's crushing it."
        />
        <meta
          name="keywords"
          content="staff leaderboard, team performance, employee recognition, hospitality staff rankings, guest feedback, staff motivation, performance tracking"
        />
        <meta property="og:title" content="Staff Leaderboard | Chatters" />
        <meta property="og:description" content="Real-time leaderboard that ranks staff by guest feedback. See who's crushing it." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/staff-leaderboard" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <WhatItShows />
      <HowItWorks />
      <WhyOperators />
      <Features />
      <InAction />
      <Testimonial />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default StaffLeaderboardPage;
