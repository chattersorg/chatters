import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  Check,
  ExternalLink,
  Zap,
  Palette,
  TrendingUp,
  Building2
} from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import Footer from '../../../components/marketing/layout/Footer';

// SECTION 1, HERO
const Hero = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-1 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
              Review Boosting
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Turn Happy Guests Into Public 5-Star Reviews
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Chatters guides satisfied guests to Google and TripAdvisor at the perfect moment, boosting your ratings with zero extra work for your team.
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
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                {/* Review Boosting Mockup - Phone Screen */}
                <div className="bg-white rounded-lg p-6 flex justify-center">
                  <div className="w-48 bg-gray-900 rounded-3xl p-2">
                    <div className="bg-white rounded-2xl overflow-hidden">
                      {/* Phone Content */}
                      <div className="p-4 text-center">
                        {/* Success Icon */}
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Check className="w-6 h-6 text-emerald-600" />
                        </div>

                        <h4 className="text-gray-900 text-sm font-semibold mb-1">Thanks for your feedback!</h4>
                        <p className="text-gray-500 text-xs mb-4">Would you share your experience?</p>

                        {/* Star Rating Display */}
                        <div className="flex justify-center gap-1 mb-4">
                          {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                        </div>

                        {/* Review Buttons */}
                        <div className="space-y-2">
                          <button className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 flex items-center justify-center gap-2 hover:bg-gray-50">
                            <div className="w-4 h-4 bg-[#4285F4] rounded-sm flex items-center justify-center">
                              <span className="text-white text-[8px] font-bold">G</span>
                            </div>
                            <span className="text-gray-700 text-xs font-medium">Review on Google</span>
                          </button>
                          <button className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 flex items-center justify-center gap-2 hover:bg-gray-50">
                            <div className="w-4 h-4 bg-[#00AF87] rounded-full flex items-center justify-center">
                              <span className="text-white text-[8px] font-bold">T</span>
                            </div>
                            <span className="text-gray-700 text-xs font-medium">Review on TripAdvisor</span>
                          </button>
                        </div>

                        <p className="text-gray-400 text-[10px] mt-3">It only takes a moment</p>
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

// SECTION 2, THE PROBLEM (Dark Background)
const Problem = () => {
  const problems = [
    'Great experiences go unnoticed',
    'Negative reviews overshadow positives',
    "Online ratings don't reflect reality",
    'New customers trust an unfair impression',
  ];

  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            The Problem: Happy Guests Rarely Leave Reviews
          </h2>

          <div className="text-xl text-slate-300 space-y-6 mb-10">
            <p>
              Unhappy guests post reviews. Happy guests usually don't.
            </p>
            <p>
              That imbalance hurts hospitality venues:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
            {problems.map((problem, index) => (
              <div key={index} className="flex items-center gap-3 text-left">
                <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                <span className="text-slate-300">{problem}</span>
              </div>
            ))}
          </div>

          <p className="text-xl text-white font-semibold">
            Chatters fixes this by capturing happy moments in the moment, and turning them into public 5-star reviews.
          </p>
        </div>
      </div>
    </section>
  );
};

// SECTION 3, HOW REVIEW BOOSTING WORKS
const HowItWorks = () => {
  const features = [
    {
      title: 'Identify satisfied guests',
      description: 'Triggered automatically when guests leave a 4 or 5-star rating.',
    },
    {
      title: 'Direct them to Google or TripAdvisor',
      description: "Sent at the exact moment they're most likely to leave a review.",
    },
    {
      title: 'Zero friction',
      description: 'One tap, right from the thank-you screen.',
    },
    {
      title: 'Fully automated for your team',
      description: 'No staff involvement. No manual follow-ups.',
    },
    {
      title: 'Timing is everything',
      description: "Guests are prompted when they're happiest, right after a great experience.",
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              How Review Boosting Works
            </h2>
          </div>

          <div className="space-y-4">
            {features.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-[#4E74FF] rounded-full flex items-center justify-center mt-0.5">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
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

// SECTION 4, THE FLOW
const TheFlow = () => {
  const steps = [
    {
      number: '1',
      title: 'Guest gives a high rating',
      description: '4 or 5 stars triggers the review pathway.',
    },
    {
      number: '2',
      title: 'Chatters displays a branded review prompt',
      description: 'Clear, friendly, no pressure.',
    },
    {
      number: '3',
      title: 'Guest taps to open Google or TripAdvisor',
      description: 'No searching or extra steps.',
    },
    {
      number: '4',
      title: 'They leave a positive public review',
      description: 'Captured at the ideal moment.',
    },
    {
      number: '5',
      title: 'Your ratings grow naturally',
      description: 'More reviews. Better averages. Stronger reputation.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            The Flow
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

// SECTION 5, WHY OPERATORS DEPEND ON REVIEW BOOSTING
const WhyOperators = () => {
  const benefits = [
    {
      title: 'More positive reviews',
      description: 'Turn everyday happy moments into public social proof.',
    },
    {
      title: 'Higher average rating',
      description: 'Reduce the impact of occasional negative reviews.',
    },
    {
      title: 'Improved local ranking',
      description: 'More Google reviews = more visibility.',
    },
    {
      title: 'Consistent reputation building',
      description: 'Every day, without manual effort.',
    },
    {
      title: 'Supports your brand',
      description: 'Your best moments become your online identity.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Operators Depend on Review Boosting
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex gap-4 items-start bg-white rounded-xl p-6 border border-gray-200"
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

// SECTION 6, FEATURES BUILT FOR HOSPITALITY MARKETING
const Features = () => {
  const features = [
    {
      icon: ExternalLink,
      title: 'Automatic Review Routing',
      description: 'Guide guests directly to Google or TripAdvisor.',
    },
    {
      icon: Zap,
      title: 'Smart Triggers',
      description: 'Only show prompts to guests who rate highly.',
    },
    {
      icon: Palette,
      title: 'Branded Review Screens',
      description: 'Your logo, your colours, your experience.',
    },
    {
      icon: TrendingUp,
      title: 'Review Trend Insights',
      description: 'Track improvement over time.',
    },
    {
      icon: Building2,
      title: 'Multi-Venue Reputation Management',
      description: 'Compare ratings across locations.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Features Built for Hospitality Marketing
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

// SECTION 7, REVIEW BOOSTING IN ACTION
const InAction = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Review Boosting in Action
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A guest leaves a 5-star rating after a great experience.
            </p>

            <p className="text-lg text-gray-700">
              Chatters immediately displays a friendly prompt:
            </p>

            <div className="bg-gray-100 border-l-4 border-[#4E74FF] p-6 rounded-r-xl">
              <p className="text-lg text-gray-800 italic">
                "Thanks for your feedback! Would you mind leaving us a quick Google review?"
              </p>
            </div>

            <p className="text-lg text-gray-700">
              They tap once. They post a 5-star review. It helps attract new guests, instantly.
            </p>

            <p className="text-xl font-bold text-gray-900 text-center">
              That's the power of timing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 8, TESTIMONIAL
const Testimonial = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-2xl sm:text-3xl text-gray-700 italic mb-8 leading-relaxed">
            "Our Google reviews skyrocketed once we turned this on. We now get positive reviews every single night, automatically."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">L</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Liam Harris</p>
              <p className="text-gray-600">Manager, The Brass & Oak</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 9, FINAL CTA
const FinalCTA = () => {
  return (
    <section className="bg-slate-900 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-10">
            Every happy guest is a potential 5-star review. Capture them.
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
const ReviewBoostingPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Review Boosting | Get More Google & TripAdvisor Reviews | Chatters</title>
        <meta
          name="description"
          content="Turn happy guests into 5-star reviews. Automatically prompt satisfied customers to leave reviews on Google and TripAdvisor at the perfect moment."
        />
        <meta
          name="keywords"
          content="review boosting, google reviews, tripadvisor reviews, restaurant reviews, get more reviews, review generation, hospitality reviews"
        />
        <meta property="og:title" content="Review Boosting | Chatters" />
        <meta property="og:description" content="Turn happy guests into 5-star reviews. Automatic prompts at the perfect moment." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/review-boosting" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <HowItWorks />
      <TheFlow />
      <WhyOperators />
      <Features />
      <InAction />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default ReviewBoostingPage;
