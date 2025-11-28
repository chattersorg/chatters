import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  Heart,
  Layers,
  AlertTriangle,
  Sparkles,
  FileText,
  Check,
  Brain,
  MessageSquare
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
              Chatters Intelligence
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Understand What Guests Mean — Not Just What They Rate
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Chatters Intelligence analyses comments and sentiment in real time — helping you understand context, emotion, and patterns hidden inside guest feedback.
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
                  src="https://placehold.co/550x400/e2e8f0/475569?text=Sentiment+Analysis+View"
                  alt="Sentiment analysis dashboard"
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
    '4 stars but frustrated about slow mains',
    '5 stars but disappointed by noise',
    '3 stars but delighted with service',
    'A neutral score with a very negative comment',
  ];

  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            The Problem: Ratings Alone Don't Tell the Full Story
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Ratings are simple. Guest feelings aren't.
            </p>

            <p>
              A table can leave:
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
              Without context, you miss the why behind the number.
            </p>

            <p>
              Chatters Intelligence adds meaning, nuance, and clarity to every piece of feedback.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — WHAT IT UNDERSTANDS
const WhatItUnderstands = () => {
  const features = [
    {
      icon: Heart,
      title: 'Sentiment behind comments',
      description: 'Knows frustration even if the rating is high.'
    },
    {
      icon: Brain,
      title: 'Meaning, not keywords',
      description: "Understands that 'food took a while' and 'mains were slow' mean the same thing."
    },
    {
      icon: Layers,
      title: 'Recurring themes',
      description: 'Groups comments into categories automatically.'
    },
    {
      icon: Sparkles,
      title: 'Hidden opportunities',
      description: 'Finds positive moments guests loved — and staff who consistently delight.'
    },
    {
      icon: AlertTriangle,
      title: 'Issue severity',
      description: 'Identifies which problems matter most, based on frequency and sentiment.'
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Chatters Intelligence Understands
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
      title: 'Guests leave comments as normal',
      description: 'No extra steps.',
    },
    {
      number: '2',
      title: 'Chatters analyses sentiment & meaning',
      description: 'Positive, neutral, or negative — plus category tagging.',
    },
    {
      number: '3',
      title: 'Patterns appear instantly',
      description: 'Slow service, cold food, noise issues, rude staff — whatever guests mention.',
    },
    {
      number: '4',
      title: 'Insights surface automatically',
      description: 'No digging. No spreadsheets.',
    },
    {
      number: '5',
      title: 'Teams act on what matters',
      description: 'Fix issues and celebrate strengths.',
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
      title: 'Catch frustration early',
      description: 'Even when scores look fine.',
    },
    {
      title: 'Understand root causes',
      description: 'Know exactly what guests are reacting to.',
    },
    {
      title: 'Reduce manager guesswork',
      description: 'Insights come pre-analysed.',
    },
    {
      title: 'Improve training',
      description: 'Coaching based on real guest language.',
    },
    {
      title: 'Strengthen service consistency',
      description: 'Teams understand what truly affects experience.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Depend on Chatters Intelligence
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
      icon: Heart,
      title: 'Sentiment Detection',
      description: 'Identifies tone instantly.',
    },
    {
      icon: Layers,
      title: 'Theme Clustering',
      description: 'Groups similar feedback automatically.',
    },
    {
      icon: AlertTriangle,
      title: 'Severity Ranking',
      description: 'Shows which issues matter most.',
    },
    {
      icon: Sparkles,
      title: 'Positive Highlights',
      description: 'Spot what guests love.',
    },
    {
      icon: FileText,
      title: 'Comment Summaries',
      description: 'Clear insights without reading every line.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Understanding Guest Sentiment
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
              Chatters Intelligence in Action
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A venue receives several comments:
            </p>

            <div className="space-y-3">
              <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-xl">
                <p className="text-gray-800 italic">"Mains were slow tonight."</p>
              </div>
              <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-xl">
                <p className="text-gray-800 italic">"Waited quite a while for food."</p>
              </div>
              <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-xl">
                <p className="text-gray-800 italic">"Service was lovely but food took ages."</p>
              </div>
            </div>

            <p className="text-lg text-gray-700">
              Individually? No one would notice.
              <br />
              Collectively? Chatters Intelligence flags <span className="font-semibold">'Slow Mains'</span> as a rising issue.
            </p>

            <p className="text-lg text-gray-700">
              The manager adjusts expo staffing during peak hours.
            </p>

            <p className="text-lg text-gray-700">
              Two days later:
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Food came out fast and hot tonight — much better!"
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
            "It shows us the story behind the numbers. We finally understand what guests mean, not just what they tap."
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
            Understand guest meaning. Fix what matters. Improve the experience.
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
const IntelligencePage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Chatters Intelligence | Understand Guest Sentiment | Chatters</title>
        <meta
          name="description"
          content="Understand what guests mean — not just what they rate. Chatters Intelligence analyses comments and sentiment in real time to reveal context, emotion, and patterns."
        />
        <meta
          name="keywords"
          content="sentiment analysis, guest feedback intelligence, hospitality AI, comment analysis, feedback patterns, guest sentiment"
        />
        <meta property="og:title" content="Chatters Intelligence | Chatters" />
        <meta property="og:description" content="Understand what guests mean — not just what they rate. Real-time sentiment analysis." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/analytics/intelligence" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <WhatItUnderstands />
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

export default IntelligencePage;
