import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  TrendingUp,
  Users,
  AlertCircle,
  BarChart3,
  Target,
  LineChart,
  Check,
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import Footer from '../../../components/marketing/layout/Footer';

// ─────────────────────────────────────────────────────────────
// SECTION 1 — HERO
// ─────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative pt-32 pb-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Text */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
            NPS Scoring
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Know Which Guests Will Return —{' '}
            <span className="text-[#4E74FF]">And Why</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            See exactly who loves your venue, who's on the fence, and who's at risk of leaving a bad review. NPS shows intent — and Chatters makes it measurable.
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
                my.getchatters.com/nps
              </div>
            </div>
            {/* NPS Dashboard Mockup */}
            <div className="bg-white p-4">
              {/* NPS Score Display */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#4E74FF] to-[#2F5CFF] mb-2">
                  <span className="text-white text-2xl font-bold">+47</span>
                </div>
                <p className="text-gray-600 text-sm">Your NPS Score</p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ThumbsUp className="w-3 h-3 text-emerald-600" />
                  </div>
                  <p className="text-emerald-700 text-lg font-bold">62%</p>
                  <p className="text-gray-500 text-[10px]">Promoters</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Minus className="w-3 h-3 text-amber-600" />
                  </div>
                  <p className="text-amber-700 text-lg font-bold">23%</p>
                  <p className="text-gray-500 text-[10px]">Passives</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ThumbsDown className="w-3 h-3 text-red-600" />
                  </div>
                  <p className="text-red-700 text-lg font-bold">15%</p>
                  <p className="text-gray-500 text-[10px]">Detractors</p>
                </div>
              </div>

              {/* Trend Line */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-xs">Trend</span>
                  <span className="text-emerald-600 text-xs font-medium">+6 this month</span>
                </div>
                <div className="flex items-end justify-between h-8 gap-1">
                  {[35, 38, 42, 41, 45, 47].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#4E74FF] rounded-t" style={{height: `${(h/50)*100}%`}}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 2 — THE PROBLEM
// ─────────────────────────────────────────────────────────────
const Problem = () => (
  <section className="py-20 bg-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ratings Show Satisfaction.{' '}
          <span className="text-[#4E74FF]">NPS Shows Loyalty.</span>
        </h2>
        <p className="text-xl text-slate-300 mb-12">
          A 4-star rating tells you someone had a "good" experience. But would they come back? Would they recommend you? NPS answers the only question that really matters.
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-slate-300">Star ratings don't predict repeat visits</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-slate-300">Survey fatigue leads to low response rates</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-slate-300">No way to identify at-risk guests</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 3 — WHAT IT REVEALS
// ─────────────────────────────────────────────────────────────
const WhatItReveals = () => {
  const features = [
    {
      icon: ThumbsUp,
      title: 'Promoters (9–10)',
      description: 'Guests who will return and recommend — your growth engine.',
    },
    {
      icon: Minus,
      title: 'Passives (7–8)',
      description: 'Satisfied but not loyal — could go either way.',
    },
    {
      icon: ThumbsDown,
      title: 'Detractors (0–6)',
      description: 'At-risk guests who may leave bad reviews or never return.',
    },
    {
      icon: LineChart,
      title: 'NPS Score Over Time',
      description: 'Track whether loyalty is improving or declining.',
    },
    {
      icon: BarChart3,
      title: 'Breakdown by Venue',
      description: 'See which locations are creating advocates.',
    },
    {
      icon: Target,
      title: 'Benchmark vs Industry',
      description: 'Compare your score against hospitality averages.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            More Than a Score — A{' '}
            <span className="text-[#4E74FF]">Loyalty Breakdown</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chatters automatically segments guests into Promoters, Passives, and Detractors so you know exactly where to focus.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-[#4E74FF]/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[#4E74FF]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 4 — HOW IT WORKS
// ─────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      title: 'Guest Leaves Feedback',
      description: 'A QR code prompt asks: "How likely are you to recommend us?"',
    },
    {
      number: '2',
      title: 'Instant Classification',
      description: 'Chatters auto-categorises the response as Promoter, Passive, or Detractor.',
    },
    {
      number: '3',
      title: 'NPS Score Updates',
      description: 'Your overall score recalculates in real time.',
    },
    {
      number: '4',
      title: 'Dashboard Reflects Changes',
      description: 'View loyalty trends, compare venues, and track over time.',
    },
    {
      number: '5',
      title: 'Take Action',
      description: 'Reach out to detractors, thank promoters, and improve your score.',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How NPS Scoring Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From feedback to loyalty insights in seconds — with no manual effort.
          </p>
        </div>
        <div className="relative">
          {/* Timeline line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#4E74FF]/20 -translate-x-1/2"></div>
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {/* Number */}
                <div className="relative z-10 w-14 h-14 bg-[#4E74FF] rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {step.number}
                </div>
                {/* Spacer */}
                <div className="flex-1 hidden lg:block"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 5 — WHY OPERATORS USE NPS
// ─────────────────────────────────────────────────────────────
const WhyOperators = () => {
  const benefits = [
    'Identify guests who will drive word-of-mouth growth',
    'Spot at-risk guests before they leave a bad review',
    'Track whether operational changes improve loyalty',
    'Compare loyalty across venues or time periods',
    'Set measurable targets for your team',
    'Benchmark against industry averages',
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Why Operators Trust{' '}
              <span className="text-[#4E74FF]">NPS Scoring</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              NPS is the gold standard for measuring customer loyalty. It predicts growth, highlights risk, and gives your team a clear number to rally around.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#4E74FF]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-[#4E74FF]" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-50 rounded-2xl p-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <img
                src="https://placehold.co/600x400/f8fafc/64748b?text=NPS+Trends"
                alt="NPS trends dashboard"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 6 — FEATURES
// ─────────────────────────────────────────────────────────────
const Features = () => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Real-Time NPS Calculation',
      description: 'Your score updates instantly as new feedback comes in.',
    },
    {
      icon: Users,
      title: 'Guest Segmentation',
      description: 'See exactly who your Promoters, Passives, and Detractors are.',
    },
    {
      icon: LineChart,
      title: 'Historical Trends',
      description: 'Track how loyalty changes weekly, monthly, or quarterly.',
    },
    {
      icon: BarChart3,
      title: 'Multi-Venue Comparison',
      description: 'Compare NPS across locations to find top performers.',
    },
    {
      icon: Target,
      title: 'Industry Benchmarks',
      description: 'See how you stack up against hospitality averages.',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to{' '}
            <span className="text-[#4E74FF]">Measure Loyalty</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful NPS tools built for hospitality operators.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            >
              <div className="w-12 h-12 bg-[#4E74FF]/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[#4E74FF]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION 7 — IN ACTION
// ─────────────────────────────────────────────────────────────
const InAction = () => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          NPS Scoring in Action
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A real example of how NPS helps operators take the right action at the right time.
        </p>
      </div>
      <div className="bg-slate-50 rounded-2xl p-8 lg:p-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ThumbsDown className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">New Detractor Alert</p>
                  <p className="text-sm text-gray-500">Table 8 • 3 minutes ago</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Food was fine but we waited 45 minutes for our mains. Wouldn't recommend."
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm font-medium text-red-600">NPS Response: 4</span>
                <span className="text-sm text-gray-400">• Detractor</span>
              </div>
            </div>
            <p className="text-gray-600">
              The manager sees the alert, apologises to the table, and offers a complimentary dessert. The guest leaves satisfied — and the review never gets written.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Weekly NPS Summary</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overall NPS</span>
                <span className="text-2xl font-bold text-[#4E74FF]">+47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Promoters</span>
                <span className="font-semibold text-green-600">62%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Passives</span>
                <span className="font-semibold text-yellow-600">23%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Detractors</span>
                <span className="font-semibold text-red-600">15%</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Up from +41 last week. Kitchen timing improvements are working.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 8 — TESTIMONIAL
// ─────────────────────────────────────────────────────────────
const Testimonial = () => (
  <section className="py-20 bg-slate-50">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
        <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-6 overflow-hidden">
          <img
            src="https://placehold.co/80x80/e2e8f0/64748b?text=DP"
            alt="Daniel Price"
            className="w-full h-full object-cover"
          />
        </div>
        <blockquote className="text-2xl text-gray-700 mb-6 leading-relaxed">
          "We always thought our ratings were good. But NPS showed us that while people were satisfied, they weren't loyal. Fixing that changed everything."
        </blockquote>
        <div>
          <p className="font-semibold text-gray-900">Daniel Price</p>
          <p className="text-gray-500">GM, Riverside Bar & Kitchen</p>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// SECTION 9 — FINAL CTA
// ─────────────────────────────────────────────────────────────
const FinalCTA = () => (
  <section className="py-20 bg-slate-900">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
        Measure Loyalty. Improve Loyalty. Grow Loyalty.
      </h2>
      <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
        Join hundreds of UK hospitality venues using NPS to turn satisfied guests into loyal advocates.
      </p>
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
const NPSScoringPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>NPS Scoring | Chatters - Know Which Guests Will Return</title>
        <meta
          name="description"
          content="Track Net Promoter Score automatically with Chatters. See who's a Promoter, Passive, or Detractor — and take action to improve guest loyalty."
        />
        <meta
          name="keywords"
          content="NPS scoring, Net Promoter Score, customer loyalty, NPS tracking, hospitality NPS, guest loyalty measurement"
        />
        <meta property="og:title" content="NPS Scoring | Chatters" />
        <meta
          property="og:description"
          content="Know which guests will return and why. Track NPS automatically and turn satisfied guests into loyal advocates."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/analytics/nps" />
      </Helmet>

      <Navbar />
      <Hero />
      <Problem />
      <WhatItReveals />
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

export default NPSScoringPage;
