import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowRight,
  Star,
  MessageSquare,
  Edit3,
  Filter,
  Tag,
  Archive,
  Search,
  Check,
  Plus,
  GripVertical,
  ToggleRight,
  Palette
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
              Question Management
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Design Feedback Forms That Actually Get Completed
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Create custom questions, set up smart logic, and build surveys guests want to complete — all without any technical skills.
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
                {/* Question Builder Mockup */}
                <div className="bg-white rounded-lg p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#4E74FF]" />
                      <span className="text-gray-900 text-sm font-medium">Question Builder</span>
                    </div>
                    <button className="bg-[#4E74FF] text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>

                  {/* Question List */}
                  <div className="space-y-2">
                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-[#4E74FF]">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-[#4E74FF]/10 text-[#4E74FF] text-[10px] px-1.5 py-0.5 rounded">Rating</span>
                            <span className="text-gray-400 text-[10px]">Required</span>
                          </div>
                          <p className="text-gray-900 text-xs font-medium">How was your overall experience?</p>
                          <div className="flex gap-0.5 mt-2">
                            {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-gray-200" />)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-emerald-500">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded">Text</span>
                            <span className="text-gray-400 text-[10px]">Optional</span>
                          </div>
                          <p className="text-gray-900 text-xs font-medium">Any comments for us?</p>
                          <div className="mt-2 bg-white border border-gray-200 rounded px-2 py-1">
                            <span className="text-gray-400 text-[10px]">Type your answer...</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-amber-500">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded">Choice</span>
                            <span className="flex items-center gap-1 text-gray-400 text-[10px]">
                              <Filter className="w-2.5 h-2.5" /> Conditional
                            </span>
                          </div>
                          <p className="text-gray-900 text-xs font-medium">What could we improve?</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="bg-white border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">Service</span>
                            <span className="bg-white border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">Food</span>
                            <span className="bg-white border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">Wait time</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-gray-400 text-[10px]">3 questions</span>
                    <div className="flex items-center gap-2">
                      <Palette className="w-3 h-3 text-gray-400" />
                      <ToggleRight className="w-4 h-4 text-[#4E74FF]" />
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
            Generic Surveys Get Generic Results
          </h2>

          <div className="text-xl text-slate-300 space-y-6">
            <p>
              One-size-fits-all feedback forms don't work. They're too long, too generic, and guests abandon them halfway through.
            </p>

            <p className="text-white font-semibold text-2xl">
              You need questions tailored to what you actually want to learn.
            </p>

            <p>
              Question Management lets you build focused, engaging surveys that guests complete — and that give you actionable insights.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3 — WHAT IT OFFERS
const WhatItOffers = () => {
  const features = [
    {
      icon: Edit3,
      title: 'Drag-and-drop builder',
      description: 'Create professional surveys visually — no coding required.'
    },
    {
      icon: Filter,
      title: 'Conditional logic',
      description: 'Show follow-up questions based on previous answers.'
    },
    {
      icon: Tag,
      title: 'Question types',
      description: 'Ratings, text, multiple choice, NPS, and more.'
    },
    {
      icon: Archive,
      title: 'Template library',
      description: 'Start with proven questions optimised for hospitality.'
    },
    {
      icon: Palette,
      title: 'Custom branding',
      description: 'Match your venue\'s look and feel perfectly.'
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Build Surveys Your Way
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
      title: 'Choose your question types',
      description: 'Ratings, text, NPS, multiple choice — pick what fits.',
    },
    {
      number: '2',
      title: 'Write your questions',
      description: 'Keep them short, specific, and actionable.',
    },
    {
      number: '3',
      title: 'Add conditional logic',
      description: 'Show follow-ups based on how guests respond.',
    },
    {
      number: '4',
      title: 'Preview and publish',
      description: 'See exactly what guests will see, then go live.',
    },
    {
      number: '5',
      title: 'Iterate based on data',
      description: 'See completion rates and refine over time.',
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

// SECTION 5 — WHY IT MATTERS
const WhyItMatters = () => {
  const benefits = [
    {
      title: 'Higher completion rates',
      description: 'Short, relevant surveys get finished.',
    },
    {
      title: 'Better insights',
      description: 'Ask the right questions, get useful answers.',
    },
    {
      title: 'Less noise',
      description: 'Filter out irrelevant feedback automatically.',
    },
    {
      title: 'Faster setup',
      description: 'Go from idea to live survey in minutes.',
    },
    {
      title: 'Easy iteration',
      description: 'Update questions anytime without hassle.',
    },
  ];

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Why Teams Love Question Management
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
      icon: MessageSquare,
      title: 'Multiple Question Types',
      description: 'Ratings, text, choice, NPS — all built in.',
    },
    {
      icon: Filter,
      title: 'Smart Logic',
      description: 'Conditional flows based on responses.',
    },
    {
      icon: Archive,
      title: 'Template Library',
      description: 'Industry-tested question sets ready to use.',
    },
    {
      icon: Palette,
      title: 'Custom Branding',
      description: 'Match your venue\'s colours and style.',
    },
    {
      icon: Search,
      title: 'Completion Analytics',
      description: 'See which questions perform best.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Features Built for Flexibility
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
              Question Management in Action
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700">
              A pub group wants to understand why weekend brunch ratings are lower than dinner.
            </p>

            <p className="text-lg text-gray-700">
              They create a targeted survey:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• <span className="font-semibold">Q1:</span> Overall experience (1-5 stars)</p>
              <p className="text-gray-700">• <span className="font-semibold">Q2:</span> If rating ≤ 3, ask "What could we improve?" (multiple choice)</p>
              <p className="text-gray-700">• <span className="font-semibold">Q3:</span> Optional comment box</p>
            </div>

            <p className="text-lg text-gray-700">
              Within a week, they discover:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
              <p className="text-gray-700">• 68% mention "wait time" as the issue</p>
              <p className="text-gray-700">• Comments reveal kitchen bottleneck during brunch rush</p>
            </div>

            <p className="text-lg text-gray-700">
              They adjust staffing. A month later:
            </p>

            <div className="bg-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic">
                "Brunch was brilliant today — food came out so quickly!"
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
            "We used to get vague feedback. Now we ask exactly what we need to know — and guests actually answer because it's so quick."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-xl">M</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Marcus Webb</p>
              <p className="text-gray-600">Operations Manager, The Plough Group</p>
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
            Ask better questions. Get better answers.
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
const QuestionManagementPage = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Question Management | Design Perfect Feedback Forms | Chatters</title>
        <meta
          name="description"
          content="Create custom feedback questions that guests actually complete. Drag-and-drop builder, conditional logic, and proven templates for hospitality."
        />
        <meta
          name="keywords"
          content="question management, feedback forms, survey builder, custom questions, conditional logic, hospitality surveys"
        />
        <meta property="og:title" content="Question Management | Chatters" />
        <meta property="og:description" content="Design feedback forms that guests actually complete. Custom questions, smart logic, proven templates." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/question-management" />
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <WhatItOffers />
      <HowItWorks />
      <WhyItMatters />
      <Features />
      <InAction />
      <Testimonial />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default QuestionManagementPage;
