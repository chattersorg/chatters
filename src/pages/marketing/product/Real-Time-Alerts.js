import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  Clock,
  UtensilsCrossed,
  HelpCircle,
  MessageSquare,
  Check,
  ArrowUpCircle,
  Circle,
  MousePointerClick,
  ClipboardCheck,
  Bell,
  AlertTriangle,
  CheckCircle,
  User,
  Smartphone
} from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import Footer from '../../../components/marketing/layout/Footer';

// ─────────────────────────────────────────────────────────────
// ANIMATED HERO MOCKUP
// ─────────────────────────────────────────────────────────────
const RealTimeAlertsMockup = () => {
  const alerts = [
    { id: 1, table: 'Table 8', rating: 2, message: 'Food taking quite a while', time: 'Just now', severity: 'urgent' },
    { id: 2, table: 'Table 3', rating: 3, message: 'Could use some help here', time: '1 min ago', severity: 'attention' },
    { id: 3, table: 'Table 12', rating: 5, message: 'Great service so far!', time: '3 min ago', severity: 'positive' },
  ];

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'urgent':
        return { bg: 'bg-red-50 border-red-200', badge: 'bg-red-500' };
      case 'attention':
        return { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-500' };
      default:
        return { bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-500' };
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-white">Live Alerts</span>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">3 active</span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const styles = getSeverityStyles(alert.severity);

          return (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${styles.bg} ${
                index === 0 && alert.severity === 'urgent' ? 'ring-2 ring-red-300' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Header Row */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-slate-800">{alert.table}</span>
                    {alert.severity === 'urgent' && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Urgent
                      </span>
                    )}
                    {alert.severity === 'attention' && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                        <Clock className="w-2.5 h-2.5" />
                        Needs attention
                      </span>
                    )}
                    {alert.severity === 'positive' && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Happy guest
                      </span>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-xs text-slate-600 mb-2">"{alert.message}"</p>

                  {/* Footer */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= alert.rating
                              ? alert.rating <= 2
                                ? 'fill-red-400 text-red-400'
                                : alert.rating <= 3
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-emerald-400 text-emerald-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500">{alert.time}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {alert.severity === 'urgent' && (
                    <button className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <Bell className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {alert.severity === 'attention' && (
                    <button className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {alert.severity === 'positive' && (
                    <button className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              Avg response: 47s
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-red-400">1</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              <span className="text-amber-400">1</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-emerald-400">1</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// SECTION 1 - HERO
const Hero = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text */}
          <div className="order-1 lg:order-1">
            {/* Eyebrow */}
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
              Real-Time Alerts
            </p>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Know the Moment a Guest Is Unhappy
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Real-time alerts notify your team instantly - so issues are resolved in seconds, not the next day.
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
              {/* Animated Mockup */}
              <div className="bg-slate-100 rounded-2xl p-4 shadow-2xl">
                <RealTimeAlertsMockup />
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
          {/* Section Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            The Real Problem: Guests Don't Speak Up
          </h2>

          {/* Body Text */}
          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Most unhappy guests won't tell your staff anything.
              <br />
              They wait. They leave. Then they post a negative review online.
            </p>

            <p className="text-white font-semibold text-2xl">
              68% of dissatisfied customers stay silent in-person.
            </p>

            <p>
              Real-Time Alerts eliminate that silence. They show you every unhappy moment the second it happens.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 - WHAT IT DETECTS
const WhatItDetects = () => {
  const detections = [
    { icon: Star, text: 'Leave a low rating' },
    { icon: Clock, text: 'Mention slow service' },
    { icon: UtensilsCrossed, text: 'Report cold or incorrect dishes' },
    { icon: HelpCircle, text: 'Request assistance' },
    { icon: MessageSquare, text: 'Leave comments showing dissatisfaction' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Heading */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Real-Time Alerts Detect
            </h2>
            <p className="text-lg text-gray-600">
              Guests trigger alerts instantly when they:
            </p>
          </div>

          {/* Detection Items */}
          <div className="space-y-4 mb-12">
            {detections.map((item, index) => (
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
            No guessing. No waiting. No missed opportunities.
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
      description: 'A fast, app-free QR code experience.',
    },
    {
      number: '2',
      title: 'Chatters Intelligence flags issues automatically',
      description: 'Low scores, help requests, and negative sentiment in comments all trigger alerts - instantly.',
    },
    {
      number: '3',
      title: 'Staff see alerts in real time',
      description: 'On your dashboard or Kiosk Mode.',
    },
    {
      number: '4',
      title: 'Staff take ownership',
      description: 'Acknowledge → resolve → follow up.',
    },
    {
      number: '5',
      title: 'Managers track everything',
      description: 'Full visibility on response times and outcomes.',
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
      </div>
    </section>
  );
};

// SECTION 5 - WHY OPERATORS DEPEND ON IT
const WhyOperators = () => {
  const benefits = [
    {
      title: 'Prevent 1-star reviews',
      description: 'Fix issues before guests leave unhappy.',
    },
    {
      title: 'Improve service consistency',
      description: 'Even on your busiest nights.',
    },
    {
      title: 'Give staff clarity',
      description: "They always know where they're needed most.",
    },
    {
      title: 'Recover guests before they churn',
      description: 'A small moment of care can save the whole experience.',
    },
    {
      title: 'Build a reputation for exceptional service',
      description: 'Guests feel looked after - and they tell others.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Depend on Real-Time Alerts
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

// SECTION 6 - FEATURES
const Features = () => {
  const features = [
    {
      icon: ArrowUpCircle,
      title: 'Urgency Prioritisation',
      description: 'Critical issues always rise to the top.',
    },
    {
      icon: Circle,
      title: 'Colour-Coded Severity',
      description: 'Red = urgent. Amber = action needed. Blue = general feedback.',
    },
    {
      icon: MousePointerClick,
      title: 'One-Tap Acknowledgement',
      description: 'Staff claim work instantly.',
    },
    {
      icon: ClipboardCheck,
      title: 'Full Resolution Tracking',
      description: 'You see who handled what - and how fast.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Real Hospitality Workflows
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

// SECTION 7 - REAL EXAMPLE
const RealExample = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Section Heading */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Real-Time Recovery in Action
            </h2>
          </div>

          {/* Story */}
          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A couple has waited too long for their mains. They quietly leave a 2-star rating with a comment:
            </p>

            {/* Guest Quote */}
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl">
              <p className="text-lg text-gray-800 italic">
                "Food taking quite a while."
              </p>
            </div>

            <p className="text-lg text-gray-700">
              Ten seconds later: A red alert appears in Kiosk Mode. A server checks in, apologises, updates the kitchen, and offers complimentary drinks.
            </p>

            {/* Outcome Card */}
            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                The couple leaves smiling. The next morning, a review appears:
              </p>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Had a small hiccup but the team handled it brilliantly. Really impressed."
              </p>
            </div>

            {/* Closing Line */}
            <p className="text-xl font-bold text-gray-900 text-center">
              That's the power of responding in seconds.
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
          {/* Quote */}
          <blockquote className="text-2xl sm:text-3xl text-gray-700 italic mb-8 leading-relaxed">
            "Real-Time Alerts changed everything for us. We fix issues before guests even ask."
          </blockquote>

          {/* Attribution */}
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">E</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Emma Walsh</p>
              <p className="text-gray-600">Owner, The Dockside</p>
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
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-10">
            Every unhappy guest is a chance to recover. Don't miss it.
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
const RealTimeAlertsPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Real-Time Alerts | Instant Guest Feedback Notifications | Chatters</title>
        <meta
          name="description"
          content="Know the moment a guest is unhappy. Real-time alerts notify your team instantly so issues are resolved in seconds, not the next day. Prevent negative reviews with Chatters."
        />
        <meta
          name="keywords"
          content="real-time alerts, guest feedback notifications, instant alerts, hospitality alerts, prevent negative reviews, customer feedback alerts"
        />
        <meta property="og:title" content="Real-Time Alerts | Chatters" />
        <meta property="og:description" content="Know the moment a guest is unhappy. Real-time alerts notify your team instantly." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/real-time-alerts" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <WhatItDetects />
      <HowItWorks />
      <WhyOperators />
      <Features />
      <RealExample />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default RealTimeAlertsPage;
