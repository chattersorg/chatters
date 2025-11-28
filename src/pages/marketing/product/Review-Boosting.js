import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  ThumbsUp,
  ExternalLink,
  TrendingUp,
  MessageSquare,
  Check,
  Filter,
  Sparkles,
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
              Review Boosting
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Turn Happy Guests Into 5-Star Reviews
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Automatically prompt satisfied guests to leave reviews on Google and TripAdvisor — right when they're most likely to do it.
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
                  src="https://placehold.co/550x400/e2e8f0/475569?text=Review+Prompt+Screen"
                  alt="Review boosting prompt shown to happy guests"
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
            Happy Guests Rarely Leave Reviews
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              Most guests who love their experience never think to leave a review.
              <br />
              But unhappy guests? They can't wait to share their frustration.
            </p>

            <p className="text-white font-semibold text-2xl">
              Only 1 in 10 satisfied customers leave reviews unprompted.
            </p>

            <p>
              Review Boosting flips the script — asking happy guests at the perfect moment.
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
    { icon: MessageSquare, text: 'Guest submits feedback via QR code' },
    { icon: Filter, text: 'Chatters identifies high ratings (4-5 stars)' },
    { icon: ThumbsUp, text: 'Happy guests see a "Share your experience" prompt' },
    { icon: ExternalLink, text: 'One tap takes them to Google or TripAdvisor' },
    { icon: Star, text: 'Your online reputation grows automatically' },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How Review Boosting Works
            </h2>
            <p className="text-lg text-gray-600">
              A seamless flow that converts satisfaction into public praise.
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
            No awkward asks. No begging. Just smart timing.
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
      title: 'Guest scans QR code',
      description: 'After their meal, they share their experience.',
    },
    {
      number: '2',
      title: 'Chatters checks the rating',
      description: 'Only guests who rated 4 or 5 stars see the prompt.',
    },
    {
      number: '3',
      title: 'Review prompt appears',
      description: '"Loved your visit? Share it on Google!"',
    },
    {
      number: '4',
      title: 'Guest taps through',
      description: 'One click opens Google or TripAdvisor, pre-loaded.',
    },
    {
      number: '5',
      title: 'Review goes live',
      description: 'Your rating improves. Your reputation grows.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            The Guest Journey
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

// SECTION 5 — WHY IT WORKS
const WhyItWorks = () => {
  const benefits = [
    {
      title: 'Perfect timing',
      description: 'Guests are asked when their experience is fresh.',
    },
    {
      title: 'Zero friction',
      description: 'One tap to leave a review — no searching required.',
    },
    {
      title: 'Only happy guests',
      description: 'Low ratings are filtered out automatically.',
    },
    {
      title: 'Platform choice',
      description: 'Guests can choose Google, TripAdvisor, or both.',
    },
    {
      title: 'Measurable results',
      description: 'Track how many reviews each campaign generates.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Review Boosting Works
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
      icon: Target,
      title: 'Smart Targeting',
      description: 'Only prompt guests who rated 4+ stars.',
    },
    {
      icon: Sparkles,
      title: 'Custom Messages',
      description: 'Personalise the prompt with your venue name.',
    },
    {
      icon: TrendingUp,
      title: 'Conversion Tracking',
      description: 'See how many guests clicked through.',
    },
    {
      icon: ExternalLink,
      title: 'Multi-Platform',
      description: 'Google, TripAdvisor, or your choice.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Built for Results
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
              Real Results
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A family finishes Sunday lunch. Great food, friendly service. They scan the QR code and leave a 5-star rating with a lovely comment.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-xl">
              <p className="text-lg text-gray-800 italic">
                "Thank you for your feedback! Loved your visit? Share it on Google — it means the world to us."
              </p>
            </div>

            <p className="text-lg text-gray-700">
              They tap the button. Google opens. They paste their comment and hit submit.
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                The next day, a new review appears:
              </p>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Brilliant Sunday roast — kids loved it. Staff were fantastic. Will be back!"
              </p>
            </div>

            <p className="text-xl font-bold text-gray-900 text-center">
              That review would never have happened without the prompt.
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
            "Our Google rating went from 4.2 to 4.6 in three months. Review Boosting made all the difference."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">S</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Sophie Turner</p>
              <p className="text-gray-600">Owner, The Meadow Kitchen</p>
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
            Your happy guests are your best marketing. Let them share it.
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
      <HowItWorksSection />
      <TheFlow />
      <WhyItWorks />
      <Features />
      <RealExample />
      <Testimonial />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default ReviewBoostingPage;
