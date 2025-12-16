// pages/marketing/TryPage.jsx
import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  CreditCard,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  MessageSquare,
  BarChart3,
  Users,
  Star
} from "lucide-react";
import Navbar from "../../components/marketing/layout/Navbar";
import Footer from "../../components/marketing/layout/Footer";

// Hero Section
const Hero = () => (
  <section className="relative pt-32 pb-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
          Free Trial
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
          Start Your Free Trial{' '}
          <span className="text-[#4E74FF]">Today</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Try Chatters free for 14 days. No credit card required. Set up in minutes and start preventing bad reviews immediately.
        </p>
      </div>
    </div>
  </section>
);

// Main Form Section
const FormSection = () => {
  // Load HubSpot form script & init
  useEffect(() => {
    const formContainer = document.getElementById('hubspot-trial-form');

    // Clear any existing form content first
    if (formContainer) {
      formContainer.innerHTML = '';
    }

    const initForm = () => {
      if (window.hbspt?.forms && formContainer) {
        window.hbspt.forms.create({
          region: "na1",
          portalId: "48822376",
          formId: "2383199b-725f-428f-9200-359049054325",
          target: "#hubspot-trial-form",
          css: "",
          cssClass: "hs-trial",
          disableInlineStyles: true,
        });
      }
    };

    const existing = document.querySelector('script[src="//js.hsforms.net/forms/embed/v2.js"]');

    if (existing) {
      // Script already loaded, just init the form
      initForm();
      return;
    }

    const script = document.createElement("script");
    script.src = "//js.hsforms.net/forms/embed/v2.js";
    script.async = true;
    script.onload = initForm;
    document.body.appendChild(script);

    return () => {
      // Cleanup: clear form on unmount
      if (formContainer) {
        formContainer.innerHTML = '';
      }
    };
  }, []);

  const benefits = [
    "Unlimited QR code feedback forms",
    "Real-time kiosk mode for staff",
    "Live floor plan & heatmaps",
    "Advanced analytics & reports",
    "NPS scoring & follow-ups",
    "Staff leaderboards & recognition",
    "Multi-location support",
    "Google Reviews integration",
    "Full customer support",
    "No setup fees or contracts"
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Benefits */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What's included in your free trial
              </h2>
              <p className="text-lg text-gray-600">
                Get full access to all Chatters features for 14 days. No credit card required, no strings attached.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#4E74FF]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-[#4E74FF]" />
                  </div>
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* No Credit Card Badge */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#4E74FF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-[#4E74FF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">No Credit Card Required</h3>
                  <p className="text-sm text-gray-600">
                    Start your trial immediately without entering payment details. We'll only ask for a card if you decide to continue after 14 days.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Form */}
          <div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Create your free account
                  </h3>
                  <p className="text-sm text-gray-600">
                    Fill in your details below to get started. We'll set up your account immediately.
                  </p>
                </div>

                {/* HubSpot Form Container */}
                <div id="hubspot-trial-form" className="hubspot-form-container"></div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    By signing up, you agree to our{" "}
                    <Link to="/terms" className="underline hover:text-gray-700">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="underline hover:text-gray-700">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-sm text-gray-500 mt-4 text-center">
              Need help getting started?{" "}
              <Link to="/contact" className="text-[#4E74FF] hover:text-[#2F5CFF] font-medium">
                Contact our team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Trust Signals Section
const TrustSignals = () => (
  <section className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-[#4E74FF]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-[#4E74FF]" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">14 Days</div>
          <div className="text-sm text-gray-600">Full-featured free trial</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-[#4E74FF]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-[#4E74FF]" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">5 Minutes</div>
          <div className="text-sm text-gray-600">Average setup time</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-[#4E74FF]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-[#4E74FF]" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">0%</div>
          <div className="text-sm text-gray-600">Credit card required</div>
        </div>
      </div>
    </div>
  </section>
);

// What You'll Get Section
const WhatYouGet = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'QR Code Feedback',
      description: 'Guests scan, rate, and share feedback in seconds. No app downloads needed.',
    },
    {
      icon: Zap,
      title: 'Real-Time Alerts',
      description: 'Staff get instant notifications when issues arise, so they can act immediately.',
    },
    {
      icon: BarChart3,
      title: 'Powerful Analytics',
      description: 'Track trends, identify patterns, and make data-driven decisions.',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Staff leaderboards, recognition, and performance insights.',
    },
    {
      icon: Star,
      title: 'Review Routing',
      description: 'Happy guests get directed to Google Reviews automatically.',
    },
    {
      icon: Shield,
      title: 'Multi-Location',
      description: 'Manage all your venues from a single dashboard.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to{' '}
            <span className="text-[#4E74FF]">Prevent Bad Reviews</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get full access to all features during your trial. No limitations, no restrictions.
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

// Final CTA
const FinalCTA = () => (
  <section className="py-20 bg-slate-900">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
        Ready to Stop Bad Reviews?
      </h2>
      <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
        Join hundreds of UK hospitality venues using Chatters to improve guest satisfaction and protect their reputation.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="#hubspot-trial-form"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('hubspot-trial-form').scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#4E74FF] rounded-lg hover:bg-[#2F5CFF] transition-all duration-200 shadow-lg hover:shadow-xl group"
        >
          Start Free Trial
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </a>
        <Link
          to="/demo"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition-all duration-200"
        >
          Book a Demo
        </Link>
      </div>
    </div>
  </section>
);

const TryPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Start Free Trial | Chatters - No Credit Card Required</title>
        <meta
          name="description"
          content="Start your free 14-day trial of Chatters. No credit card required. Prevent bad reviews with real-time guest feedback and instant staff alerts."
        />
        <meta
          name="keywords"
          content="free trial restaurant software, hospitality feedback trial, QR code feedback free trial, restaurant review management, guest feedback system trial"
        />
        <link rel="canonical" href="https://getchatters.com/try" />
        <meta property="og:title" content="Start Free Trial | Chatters - No Credit Card Required" />
        <meta
          property="og:description"
          content="Start your free 14-day trial of Chatters. No credit card required. Prevent bad reviews with real-time guest feedback."
        />
        <meta property="og:type" content="website" />
        <meta property="twitter:title" content="Start Free Trial | Chatters - No Credit Card Required" />
        <meta property="twitter:description" content="Start your free 14-day trial. No credit card required." />
      </Helmet>

      <Navbar />
      <Hero />
      <FormSection />
      <TrustSignals />
      <WhatYouGet />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default TryPage;
