import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  Eye,
  Bell,
  Table2,
  Zap,
  Check,
  Clock,
  Monitor,
  Users,
  TrendingUp,
  Circle
} from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import Footer from '../../../components/marketing/layout/Footer';

// SECTION 1 — HERO
const Hero = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text */}
          <div className="order-1 lg:order-1">
            {/* Eyebrow */}
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
              Kiosk Mode
            </p>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              One Screen. Every Table. Nothing Missed.
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              A live dashboard designed for front-of-house — showing real-time alerts, table statuses, and guest requests on a single screen.
            </p>

            {/* Buttons */}
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

          {/* Right Column - Visuals */}
          <div className="order-2 lg:order-2 relative px-4 sm:px-0 mt-8 lg:mt-0">
            <div className="relative mx-4 sm:mx-0">
              {/* MacBook-style mockup */}
              <div className="bg-gray-900 rounded-xl p-2 pb-3 shadow-2xl">
                {/* Browser top bar */}
                <div className="flex items-center gap-2 px-2 pb-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  </div>
                </div>
                {/* Screen content - Kiosk Mode Mockup */}
                <div className="bg-slate-800 rounded-lg p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-white text-sm font-medium">Kiosk Mode</span>
                    </div>
                    <span className="text-slate-400 text-xs">Live</span>
                  </div>

                  {/* Floor Plan Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {/* Tables */}
                    <div className="bg-emerald-500/30 border border-emerald-500 rounded-lg p-2 text-center">
                      <span className="text-emerald-400 text-xs font-medium">T1</span>
                    </div>
                    <div className="bg-emerald-500/30 border border-emerald-500 rounded-lg p-2 text-center">
                      <span className="text-emerald-400 text-xs font-medium">T2</span>
                    </div>
                    <div className="bg-amber-500/30 border border-amber-500 rounded-lg p-2 text-center">
                      <span className="text-amber-400 text-xs font-medium">T3</span>
                    </div>
                    <div className="bg-emerald-500/30 border border-emerald-500 rounded-lg p-2 text-center">
                      <span className="text-emerald-400 text-xs font-medium">T4</span>
                    </div>
                    <div className="bg-red-500/30 border border-red-500 rounded-lg p-2 text-center">
                      <span className="text-red-400 text-xs font-medium">T5</span>
                    </div>
                    <div className="bg-emerald-500/30 border border-emerald-500 rounded-lg p-2 text-center">
                      <span className="text-emerald-400 text-xs font-medium">T6</span>
                    </div>
                    <div className="bg-emerald-500/30 border border-emerald-500 rounded-lg p-2 text-center">
                      <span className="text-emerald-400 text-xs font-medium">T7</span>
                    </div>
                    <div className="bg-amber-500/30 border border-amber-500 rounded-lg p-2 text-center">
                      <span className="text-amber-400 text-xs font-medium">T8</span>
                    </div>
                  </div>

                  {/* Priority Queue */}
                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs font-medium">Priority Queue</p>
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        <span className="text-white text-xs">Table 5</span>
                      </div>
                      <span className="text-red-400 text-xs">2 min</span>
                    </div>
                    <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                        <span className="text-white text-xs">Table 3</span>
                      </div>
                      <span className="text-amber-400 text-xs">5 min</span>
                    </div>
                    <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                        <span className="text-white text-xs">Table 8</span>
                      </div>
                      <span className="text-amber-400 text-xs">8 min</span>
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
          {/* Section Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            Busy Service Creates Blind Spots
          </h2>

          {/* Body Text */}
          <div className="text-xl text-slate-300 space-y-6">
            <p>
              When the floor is packed, it's easy to miss what matters most.
              <br />
              Staff are moving fast. Feedback is coming in. Alerts are firing.
              <br />
              But who's watching?
            </p>

            <p className="text-white font-semibold text-2xl">
              Kiosk Mode puts everything you need on one always-on screen.
            </p>

            <p>
              No digging. No refreshing. Just clarity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — COMMAND CENTRE
const CommandCentre = () => {
  const features = [
    { icon: Bell, text: 'Live alerts for every table' },
    { icon: Table2, text: 'Table-level feedback summaries' },
    { icon: Zap, text: 'Assistance requests as they arrive' },
    { icon: Eye, text: 'Unresolved issues highlighted' },
    { icon: Clock, text: 'Time-since-submission for every guest' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Heading */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Your Command Centre for Service
            </h2>
            <p className="text-lg text-gray-600">
              Kiosk Mode is a live view of your venue — built to run all shift long.
            </p>
          </div>

          {/* Feature Items */}
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

          {/* Closing Line */}
          <p className="text-center text-xl font-bold text-gray-900">
            One screen. Full awareness. No tab-switching.
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
      title: 'Open Kiosk Mode on any screen',
      description: 'A tablet, monitor, or wall-mounted display.',
    },
    {
      number: '2',
      title: 'New feedback, alerts, and requests stream in live',
      description: 'Everything appears automatically — no manual refresh needed.',
    },
    {
      number: '3',
      title: 'Staff see colour-coded priorities at a glance',
      description: 'Red = urgent. Amber = needs attention. Blue = info only.',
    },
    {
      number: '4',
      title: 'One tap claims a task',
      description: 'Staff take ownership, preventing double-handling.',
    },
    {
      number: '5',
      title: 'Resolved items disappear from the screen',
      description: 'Only active, relevant alerts remain visible.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            How It Works
          </h2>
        </div>

        {/* Steps Timeline */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block"></div>

            {steps.map((step, index) => (
              <div key={index} className="relative flex gap-6 pb-12 last:pb-0">
                {/* Number circle */}
                <div className="flex-shrink-0 w-12 h-12 bg-[#4E74FF] rounded-full flex items-center justify-center text-white font-bold text-lg z-10">
                  {step.number}
                </div>

                {/* Content */}
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

        {/* Colour-Coded Priority Callout */}
        <div className="max-w-3xl mx-auto mt-16">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              Colour-Coded Priority System
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <Circle className="w-6 h-6 fill-red-500 text-red-500" />
                <div>
                  <p className="font-semibold text-gray-900">Red</p>
                  <p className="text-sm text-gray-600">Urgent issue</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <Circle className="w-6 h-6 fill-amber-500 text-amber-500" />
                <div>
                  <p className="font-semibold text-gray-900">Amber</p>
                  <p className="text-sm text-gray-600">Needs attention</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Circle className="w-6 h-6 fill-blue-500 text-blue-500" />
                <div>
                  <p className="font-semibold text-gray-900">Blue</p>
                  <p className="text-sm text-gray-600">Info only</p>
                </div>
              </div>
            </div>
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
      title: 'Faster responses',
      description: 'Staff spot issues the moment they arise.',
    },
    {
      title: 'No forgotten tables',
      description: 'Every request stays visible until resolved.',
    },
    {
      title: 'Clearer team coordination',
      description: 'Everyone sees the same view — no confusion.',
    },
    {
      title: 'Fewer complaints',
      description: 'Problems are handled before they escalate.',
    },
    {
      title: 'Service that feels seamless',
      description: 'Guests notice when nothing slips through the cracks.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Depend on Kiosk Mode
          </h2>
        </div>

        {/* Benefits Grid */}
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
      icon: Monitor,
      title: 'Auto-Refresh',
      description: 'The screen updates on its own — no manual action needed.',
    },
    {
      icon: TrendingUp,
      title: 'Priority Sorting',
      description: 'Most urgent alerts always rise to the top.',
    },
    {
      icon: Users,
      title: 'Multi-Staff View',
      description: 'Anyone can claim and resolve tasks.',
    },
    {
      icon: Zap,
      title: 'Works on Any Device',
      description: 'Tablets, TVs, or monitors — plug in and go.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for High-Pressure Hospitality
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#4E74FF]/50 hover:shadow-md transition-all duration-300"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#4E74FF]/10 rounded-xl mb-4">
                <feature.icon className="w-7 h-7 text-[#4E74FF]" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>

              {/* Description */}
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
          {/* Section Heading */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              What It Looks Like on the Floor
            </h2>
          </div>

          {/* Story */}
          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              It's a packed Saturday night. Thirty covers just arrived for a private party. The floor team's stretched thin.
            </p>

            <p className="text-lg text-gray-700">
              A guest on Table 4 submits feedback: slow service, 2 stars. On the Kiosk screen, the alert appears in red.
            </p>

            {/* Alert Callout */}
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl">
              <div className="flex items-center gap-3">
                <Circle className="w-5 h-5 fill-red-500 text-red-500" />
                <p className="text-lg text-gray-800 font-medium">
                  Table 4 — Low rating — "Service a bit slow tonight"
                </p>
              </div>
            </div>

            <p className="text-lg text-gray-700">
              The host spots it, taps Acknowledge, walks over, and checks in with the table. A quick apology and a round of drinks later, the couple's settled.
            </p>

            {/* Outcome Card */}
            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                At the end of the night, they leave a review:
              </p>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "The place was heaving but staff still made time for us. Felt looked after."
              </p>
            </div>

            {/* Closing Line */}
            <p className="text-xl font-bold text-gray-900 text-center">
              Without Kiosk Mode, that issue would've been missed. With it — one screen, instant awareness.
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
          {/* Quote */}
          <blockquote className="text-2xl sm:text-3xl text-gray-700 italic mb-8 leading-relaxed">
            "Kiosk Mode is always running in our pass. It's the first thing the team checks during busy service."
          </blockquote>

          {/* Attribution */}
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">D</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Daniel Price</p>
              <p className="text-gray-600">GM, The Royal Oak Group</p>
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
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-10">
            See everything. Miss nothing. Serve faster.
          </h2>

          {/* Buttons */}
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
const KioskModePage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Kiosk Mode | Live Dashboard for Front-of-House | Chatters</title>
        <meta
          name="description"
          content="One screen. Every table. Nothing missed. Kiosk Mode is a live dashboard showing real-time alerts, table statuses, and guest requests on a single screen for hospitality teams."
        />
        <meta
          name="keywords"
          content="kiosk mode, hospitality dashboard, live alerts, front of house display, restaurant management, real-time feedback display, table management"
        />
        <meta property="og:title" content="Kiosk Mode | Chatters" />
        <meta property="og:description" content="One screen. Every table. Nothing missed. Live dashboard for front-of-house teams." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/kiosk-mode" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <CommandCentre />
      <HowItWorks />
      <WhyOperators />
      <Features />
      <RealExample />
      <Testimonial />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default KioskModePage;
