import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  Building2,
  Clock,
  Users,
  Bed,
  Check,
  Bell,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import Footer from '../../../components/marketing/layout/Footer';

// ─────────────────────────────────────────────────────────────
// HOTEL DASHBOARD MOCKUP
// ─────────────────────────────────────────────────────────────
const HotelDashboardMockup = () => {
  const [pulsingCard, setPulsingCard] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsingCard(0);
      setTimeout(() => setPulsingCard(null), 1000);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const feedbackItems = [
    { room: 'Room 412', dept: 'Housekeeping', rating: 2, time: 'Just now', comment: 'Bathroom not cleaned properly', urgent: true },
    { room: 'Room 208', dept: 'Front Desk', rating: 3, time: '5 min ago', comment: 'Check-in was slow', urgent: false },
    { room: 'Room 315', dept: 'Concierge', rating: 5, time: '12 min ago', comment: 'Great restaurant recommendation!', urgent: false },
  ];

  const getRatingColor = (rating) => {
    if (rating <= 2) return 'bg-red-500';
    if (rating <= 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getRatingBg = (rating) => {
    if (rating <= 2) return 'bg-red-50 border-red-200';
    if (rating <= 3) return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  const getDeptColor = (dept) => {
    switch (dept) {
      case 'Housekeeping': return 'bg-purple-100 text-purple-700';
      case 'Front Desk': return 'bg-blue-100 text-blue-700';
      case 'Concierge': return 'bg-teal-100 text-teal-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-white">Hotel Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Today</span>
          <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">
            <Bell className="w-3 h-3" />
            <span>1 urgent</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-white">4.6</p>
          <p className="text-[10px] text-slate-400">Avg Rating</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-emerald-400">23</p>
          <p className="text-[10px] text-slate-400">Feedback Today</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-amber-400">3m</p>
          <p className="text-[10px] text-slate-400">Avg Response</p>
        </div>
      </div>

      {/* Feedback Cards */}
      <div className="space-y-2">
        {feedbackItems.map((item, index) => (
          <div
            key={index}
            className={`rounded-lg p-3 border transition-all duration-300 ${getRatingBg(item.rating)} ${
              pulsingCard === index ? 'ring-2 ring-blue-400 scale-[1.02]' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-xs text-slate-800">{item.room}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getDeptColor(item.dept)}`}>
                    {item.dept}
                  </span>
                  {item.urgent && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">{item.comment}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className={`${getRatingColor(item.rating)} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                  {item.rating}/5
                </div>
                <span className="text-[10px] text-slate-500">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// SECTION 1, HERO
const Hero = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-1 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
              Hotels
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Turn Guest Concerns Into 5-Star Stays.
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Real-time feedback for hotels, catch service issues, respond to guest concerns, and protect your TripAdvisor rating while guests are still on property.
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
                <HotelDashboardMockup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 2, THE PROBLEM
const Problem = () => {
  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            Guest Issues Slip Through the Cracks
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              A guest checks in after a long flight. The room isn't ready. Housekeeping missed a spot.
              <br />
              They don't call reception, they just post a review from bed.
            </p>

            <p className="text-white font-semibold text-2xl">
              You can't fix what you don't know about.
            </p>

            <p>
              Chatters gives your team visibility across every room, from check-in to checkout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3, BUILT FOR HOTELS
const BuiltForHotels = () => {
  const features = [
    { icon: Building2, text: 'Designed for multi-department hotel operations' },
    { icon: Clock, text: '24/7 feedback collection across all touchpoints' },
    { icon: Users, text: 'Works for housekeeping, front desk, and concierge' },
    { icon: Bed, text: 'In-room QR codes that guests actually use' },
    { icon: Bell, text: 'Department-specific alerts and escalation' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Built for Hotels
            </h2>
            <p className="text-lg text-gray-600">
              We understand the complexity of hotel operations, that's why we built for it.
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
            Feedback that works across every department.
          </p>
        </div>
      </div>
    </section>
  );
};

// SECTION 4, HOW IT WORKS
const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      title: 'QR codes in rooms and common areas',
      description: 'Guests can share feedback from their room, the lobby, or restaurant.',
    },
    {
      number: '2',
      title: 'Quick, simple feedback form',
      description: 'Rating + optional comment. Takes under a minute.',
    },
    {
      number: '3',
      title: 'Right team alerted instantly',
      description: 'Housekeeping issues go to housekeeping. Front desk issues go to reception.',
    },
    {
      number: '4',
      title: 'Issues resolved during stay',
      description: 'Staff address concerns before guests check out.',
    },
    {
      number: '5',
      title: 'Happy guests, better reviews',
      description: 'Problems become recovery stories, not Booking.com complaints.',
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

// SECTION 5, WHY HOTELS CHOOSE CHATTERS
const WhyHotelsChoose = () => {
  const benefits = [
    {
      title: 'Catch issues during stays',
      description: "Don't wait for checkout to find out something was wrong.",
    },
    {
      title: 'Protect your online reputation',
      description: 'Fix problems before they become TripAdvisor reviews.',
    },
    {
      title: 'Improve departmental performance',
      description: 'Track feedback by department to identify training needs.',
    },
    {
      title: 'Build guest loyalty',
      description: 'Show guests you care, turn problems into memorable recoveries.',
    },
    {
      title: 'Manage multiple properties',
      description: 'Perfect for hotel groups with properties across regions.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Hotels Choose Chatters
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

// SECTION 6, FEATURES
const Features = () => {
  const features = [
    {
      icon: Bell,
      title: 'Real-Time Alerts',
      description: "The right department notified instantly.",
    },
    {
      icon: TrendingUp,
      title: 'Performance Insights',
      description: 'Track trends across departments and properties.',
    },
    {
      icon: Shield,
      title: 'Review Protection',
      description: 'Resolve issues before they hit TripAdvisor.',
    },
    {
      icon: Zap,
      title: 'Fast Setup',
      description: 'Live in under a day. Minimal IT involvement.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Everything You Need to Run a Better Hotel
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

// SECTION 7, REAL EXAMPLE
const RealExample = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              A Housekeeping Save
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              It's 3pm. A business traveller checks into room 412 after a long flight. The bathroom hasn't been cleaned properly, there's hair in the shower and the towels look used. Exhausted and frustrated, she scans the QR code on the bedside table.
            </p>

            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl">
              <p className="text-lg text-gray-800 italic">
                "Room not properly cleaned. Very disappointed after a long journey."
              </p>
            </div>

            <p className="text-lg text-gray-700">
              The alert hits housekeeping instantly. Within 10 minutes, the supervisor is at the door with fresh towels, apologies, and a complimentary room service voucher. The room is deep-cleaned while she grabs coffee in the lobby.
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                Two days later, a review appears:
              </p>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Initial hiccup with housekeeping but the team responded incredibly fast. Felt genuinely looked after. Will definitely stay again."
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 text-center">
              That's a 1-star complaint turned into a 5-star recovery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 8, FINAL CTA
const FinalCTA = () => {
  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-10">
            Run a better hotel. Start today.
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
const HotelSolutionPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Hotel Feedback Software | Prevent Bad Reviews | Chatters</title>
        <meta
          name="description"
          content="Real-time feedback for hotels. Catch guest issues, respond to concerns, and protect your TripAdvisor rating. Built for multi-department hotel operations."
        />
        <meta
          name="keywords"
          content="hotel feedback software, hotel guest feedback, hospitality feedback, hotel management, prevent bad reviews, guest experience hotels"
        />
        <meta property="og:title" content="Hotel Feedback Software | Chatters" />
        <meta property="og:description" content="Turn guest concerns into 5-star stays. Real-time feedback for hotels." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.getchatters.com/solutions/hotels" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.getchatters.com/" },
              { "@type": "ListItem", "position": 2, "name": "Solutions", "item": "https://www.getchatters.com/features" },
              { "@type": "ListItem", "position": 3, "name": "Hotels", "item": "https://www.getchatters.com/solutions/hotels" }
            ]
          })}
        </script>
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <BuiltForHotels />
      <HowItWorks />
      <WhyHotelsChoose />
      <Features />
      <RealExample />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default HotelSolutionPage;
