import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  Beer,
  Clock,
  Users,
  Music,
  Check,
  Bell,
  TrendingUp,
  Shield,
  Zap
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
              Pubs & Bars
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Keep Punters Happy. Keep Reviews Positive.
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Real-time feedback for busy pubs and bars — catch service issues, respond to complaints, and turn regulars into advocates.
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
                  src="https://placehold.co/550x400/e2e8f0/475569?text=Pub+Dashboard"
                  alt="Chatters dashboard for pubs and bars"
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
            Busy Bars Can't Catch Every Issue
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Friday night. Music's loud. Bar's three-deep.
              <br />
              A customer waits too long for food. They don't complain to staff — they just leave and post a review.
            </p>

            <p className="text-white font-semibold text-2xl">
              You can't fix what you don't see.
            </p>

            <p>
              Chatters gives your team eyes on every table — even when the floor is packed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — BUILT FOR PUBS
const BuiltForPubs = () => {
  const features = [
    { icon: Beer, text: 'Designed for high-volume, fast-paced service' },
    { icon: Clock, text: 'Quick feedback collection (30 seconds or less)' },
    { icon: Users, text: 'Works for bar staff, floor staff, and managers' },
    { icon: Music, text: 'Visual alerts that cut through the noise' },
    { icon: Bell, text: 'Instant notifications for urgent issues' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Built for Pubs and Bars
            </h2>
            <p className="text-lg text-gray-600">
              We know your world is different — that's why we built for it.
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
            Feedback that fits the pace of a busy pub.
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
      title: 'QR codes on tables and at the bar',
      description: 'Guests can scan and share feedback anytime.',
    },
    {
      number: '2',
      title: 'Quick, simple feedback form',
      description: 'Rating + optional comment. Takes 30 seconds.',
    },
    {
      number: '3',
      title: 'Staff alerted instantly',
      description: 'Low ratings or complaints trigger real-time alerts.',
    },
    {
      number: '4',
      title: 'Issues resolved on the spot',
      description: 'Staff check in with the guest before they leave.',
    },
    {
      number: '5',
      title: 'Happy guests, better reviews',
      description: 'Problems become recovery stories — not TripAdvisor rants.',
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

// SECTION 5 — WHY PUBS CHOOSE CHATTERS
const WhyPubsChoose = () => {
  const benefits = [
    {
      title: 'Catch issues during service',
      description: "Don't wait until the next day to find out something went wrong.",
    },
    {
      title: 'Keep regulars coming back',
      description: 'Show customers you care — even on your busiest nights.',
    },
    {
      title: 'Protect your reputation',
      description: 'Fix problems before they turn into 1-star reviews.',
    },
    {
      title: 'Improve staff performance',
      description: 'Give your team real feedback to learn from.',
    },
    {
      title: 'Manage multiple venues',
      description: 'Perfect for pub groups with sites across the region.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Pubs Choose Chatters
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
      icon: Bell,
      title: 'Real-Time Alerts',
      description: "Staff notified instantly when something's wrong.",
    },
    {
      icon: TrendingUp,
      title: 'Performance Insights',
      description: 'See trends across shifts, days, and seasons.',
    },
    {
      icon: Shield,
      title: 'Review Protection',
      description: 'Resolve issues before they hit TripAdvisor.',
    },
    {
      icon: Zap,
      title: 'Fast Setup',
      description: 'Live in under an hour. No tech skills needed.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Everything You Need to Run a Better Pub
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

// SECTION 7 — REAL EXAMPLE
const RealExample = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              A Saturday Night Save
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              It's 9pm on a Saturday. The pub's rammed. A couple at table 14 have been waiting 40 minutes for food. They're fed up — but instead of flagging a server, they scan the QR code and leave a 2-star rating.
            </p>

            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl">
              <p className="text-lg text-gray-800 italic">
                "Waited ages for food. About to leave."
              </p>
            </div>

            <p className="text-lg text-gray-700">
              The alert hits the Kiosk screen behind the bar. The supervisor sees it immediately, checks the kitchen, and personally delivers the food with an apology and a round of drinks on the house.
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                The next day, a review appears:
              </p>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4].map((star) => (
                  <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              </div>

              <p className="text-lg text-gray-800 italic">
                "Kitchen was slow but the team really looked after us. Free drinks and a genuine apology. We'll be back."
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 text-center">
              That's a 1-star review turned into a 5-star recovery.
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
            "We've stopped dreading the weekend rush. Chatters lets us catch problems while we can still fix them."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">T</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Tom Williams</p>
              <p className="text-gray-600">Owner, The King's Arms</p>
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
            Run a better pub. Start tonight.
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
const PubsBarsSolutionPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Pubs & Bars Feedback Software | Prevent Bad Reviews | Chatters</title>
        <meta
          name="description"
          content="Real-time feedback for busy pubs and bars. Catch service issues, respond to complaints, and turn regulars into advocates. Built for high-volume hospitality."
        />
        <meta
          name="keywords"
          content="pub feedback software, bar feedback system, hospitality feedback, pub management, prevent bad reviews, customer feedback pubs"
        />
        <meta property="og:title" content="Pubs & Bars Feedback Software | Chatters" />
        <meta property="og:description" content="Keep punters happy. Keep reviews positive. Real-time feedback for busy pubs and bars." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/solutions/pubs-bars" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <BuiltForPubs />
      <HowItWorks />
      <WhyPubsChoose />
      <Features />
      <RealExample />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default PubsBarsSolutionPage;
