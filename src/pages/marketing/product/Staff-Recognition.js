import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  Award,
  Mail,
  Heart,
  Users,
  Check,
  Trophy,
  Sparkles,
  MessageSquare,
  TrendingUp
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
              Staff Recognition
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Celebrate Your Team When Guests Do
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Automatically send recognition emails to staff when guests mention them by name — boosting morale and reinforcing great service.
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
                  src="https://placehold.co/550x400/e2e8f0/475569?text=Recognition+Email"
                  alt="Staff recognition email preview"
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
            Great Service Often Goes Unnoticed
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Your team works hard. Guests notice.
              <br />
              But too often, that praise stays buried in feedback forms — never reaching the person who earned it.
            </p>

            <p className="text-white font-semibold text-2xl">
              Recognition shouldn't depend on a manager remembering to share it.
            </p>

            <p>
              Staff Recognition automates the celebration — so your team feels valued, every time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — HOW IT WORKS
const HowItWorksSection = () => {
  const features = [
    { icon: MessageSquare, text: 'Guest leaves feedback mentioning a staff member' },
    { icon: Sparkles, text: 'Chatters detects the name automatically' },
    { icon: Mail, text: 'Recognition email sent to the staff member' },
    { icon: Heart, text: 'Staff sees exactly what the guest said' },
    { icon: Trophy, text: 'Morale boosts. Retention improves.' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How Staff Recognition Works
            </h2>
            <p className="text-lg text-gray-600">
              From guest comment to staff inbox — automatically.
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
            No manual effort. No missed moments. Just appreciation.
          </p>
        </div>
      </div>
    </section>
  );
};

// SECTION 4 — THE FLOW
const TheFlow = () => {
  const steps = [
    {
      number: '1',
      title: 'Guest submits feedback',
      description: 'They mention "Sarah was brilliant" in their comment.',
    },
    {
      number: '2',
      title: 'Chatters matches the name',
      description: 'Sarah is on your staff list — she gets the credit.',
    },
    {
      number: '3',
      title: 'Email sent automatically',
      description: 'Sarah receives a recognition email within minutes.',
    },
    {
      number: '4',
      title: 'The full quote is included',
      description: '"Sarah made our anniversary dinner so special."',
    },
    {
      number: '5',
      title: 'Manager is copied (optional)',
      description: 'Leadership stays in the loop without lifting a finger.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            The Recognition Journey
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

// SECTION 5 — WHY IT MATTERS
const WhyItMatters = () => {
  const benefits = [
    {
      title: 'Boost morale instantly',
      description: 'Nothing beats hearing "a guest loved what you did."',
    },
    {
      title: 'Improve retention',
      description: 'Staff who feel valued stay longer.',
    },
    {
      title: 'Reinforce great behaviour',
      description: 'Recognition encourages more of the same.',
    },
    {
      title: 'Zero admin for managers',
      description: 'It happens automatically — no forwarding required.',
    },
    {
      title: 'Build a positive culture',
      description: 'Celebration becomes part of how you operate.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Staff Recognition Matters
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
      icon: Users,
      title: 'Staff Directory Sync',
      description: 'Add your team once — Chatters handles the rest.',
    },
    {
      icon: Mail,
      title: 'Branded Emails',
      description: "Recognition emails match your venue's look.",
    },
    {
      icon: Award,
      title: 'Manager CC',
      description: 'Optionally copy leadership on every recognition.',
    },
    {
      icon: TrendingUp,
      title: 'Recognition Reports',
      description: "See who's getting praised — and how often.",
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Hospitality Teams
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
              A Moment That Matters
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A couple finishes dinner. Before they leave, they scan the QR code and write:
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-xl">
              <p className="text-lg text-gray-800 italic">
                "James was absolutely wonderful — he recommended the wine pairing and it made the whole meal. Thank you!"
              </p>
            </div>

            <p className="text-lg text-gray-700">
              Ten minutes later, James gets an email:
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-6 h-6 text-[#4E74FF]" />
                <p className="font-bold text-gray-900">You've been recognised!</p>
              </div>

              <p className="text-gray-700 mb-4">
                A guest just mentioned you in their feedback:
              </p>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "James was absolutely wonderful — he recommended the wine pairing and it made the whole meal."
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 text-center">
              That email costs nothing — but means everything.
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
            "My team lights up when they get a recognition email. It's such a simple thing, but it's made a huge difference to morale."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">R</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Rachel Greene</p>
              <p className="text-gray-600">GM, The Waterside Inn</p>
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
            Your team deserves to hear the good stuff.
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
const StaffRecognitionPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Staff Recognition | Automated Team Appreciation | Chatters</title>
        <meta
          name="description"
          content="Celebrate your team when guests do. Automatically send recognition emails to staff when guests mention them by name — boosting morale and reinforcing great service."
        />
        <meta
          name="keywords"
          content="staff recognition, employee appreciation, team morale, hospitality staff, automated recognition, employee retention, staff feedback"
        />
        <meta property="og:title" content="Staff Recognition | Chatters" />
        <meta property="og:description" content="Celebrate your team when guests do. Automated recognition emails boost morale." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/staff-recognition" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <HowItWorksSection />
      <TheFlow />
      <WhyItMatters />
      <Features />
      <RealExample />
      <Testimonial />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default StaffRecognitionPage;
