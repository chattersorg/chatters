import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Navbar from "../../components/marketing/layout/Navbar";
import Footer from "../../components/marketing/layout/Footer";
import { Bell, Shield, TrendingUp, Zap, Clock, Star } from "lucide-react";

// CSS to make HubSpot iframe fill container seamlessly
const hubspotStyles = `
  .meetings-iframe-container {
    position: relative;
    width: 100%;
    background: #fff;
  }
  .meetings-iframe-container iframe {
    width: 100% !important;
    min-height: 680px !important;
    border: none !important;
    display: block;
  }
`;

const DemoPage = () => {
  useEffect(() => {
    // Load HubSpot Meetings script once
    if (!document.querySelector('script[src="https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"]')) {
      const script = document.createElement("script");
      script.src = "https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const benefits = [
    {
      icon: Bell,
      title: "Catch problems in real-time",
      description: "Get instant alerts when a guest is unhappy — while they're still at the table."
    },
    {
      icon: Shield,
      title: "Stop bad reviews before they happen",
      description: "Resolve issues before guests leave and post on Google or TripAdvisor."
    },
    {
      icon: TrendingUp,
      title: "Turn happy guests into 5-star reviews",
      description: "Automatically prompt satisfied customers to share their experience online."
    },
    {
      icon: Zap,
      title: "Go live in under 5 minutes",
      description: "Just print QR codes. No app downloads, no hardware, no training needed."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>See How It Works | Chatters</title>
        <meta
          name="description"
          content="See how Chatters prevents bad reviews with real-time guest feedback and instant staff alerts. Book a quick 15-minute walkthrough."
        />
        <link rel="canonical" href="https://getchatters.com/demo" />
        <style>{hubspotStyles}</style>
      </Helmet>

      <Navbar overlay />

      {/* Hero Section - Above the fold */}
      <section className="relative pt-32 lg:pt-40 pb-12 lg:pb-16 bg-gradient-to-b from-white via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

            {/* Left Column - Value Proposition */}
            <div className="lg:pt-4">
              {/* Eyebrow */}
              <p className="text-sm font-semibold uppercase tracking-wide text-[#4E74FF] mb-4">
                15-Minute Walkthrough
              </p>

              {/* Main Headline */}
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                See How Venues Prevent{" "}
                <span className="text-[#4E74FF]">Bad Reviews</span>{" "}
                Before They Happen
              </h1>

              {/* Subheadline */}
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We'll show you exactly how guests leave feedback, how your team gets alerted instantly, and how you protect your ratings — all in 15 minutes.
              </p>

              {/* Benefits List */}
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#4E74FF]/10 rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-5 h-5 text-[#4E74FF]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{benefit.title}</p>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>15 mins, no pressure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span>Built for UK hospitality</span>
                </div>
              </div>
            </div>

            {/* Right Column - HubSpot Calendar */}
            <div className="lg:sticky lg:top-24">
              <div className="relative">
                {/* Card container */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
                  {/* Card header */}
                  <div className="bg-gray-900 px-6 py-5 text-center">
                    <p className="text-white font-semibold text-lg">Book Your Walkthrough</p>
                    <p className="text-gray-400 text-sm mt-1">Pick a time that works for you</p>
                  </div>

                  {/* HubSpot Meetings inline embed */}
                  <div
                    className="meetings-iframe-container bg-white"
                    data-src="https://meetings.hubspot.com/will902?embed=true"
                  ></div>
                </div>

                {/* Decorative glow */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 rounded-3xl blur-3xl -z-10 opacity-60"
                  style={{
                    background: "radial-gradient(closest-side, rgba(78,116,255,0.15), transparent 70%)",
                  }}
                />
              </div>

              {/* Alternative contact */}
              <p className="text-sm text-gray-500 mt-4 text-center">
                Prefer email?{" "}
                <a href="mailto:hello@getchatters.com" className="text-[#4E74FF] hover:underline font-medium">
                  hello@getchatters.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll See Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              What We'll Cover
            </h2>
            <p className="text-gray-600">
              A focused walkthrough tailored to your venue type
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                number: "1",
                title: "The Guest Experience",
                description: "See exactly what guests see when they scan your QR code and leave feedback."
              },
              {
                number: "2",
                title: "Real-Time Alerts",
                description: "How your team gets notified instantly when something needs attention."
              },
              {
                number: "3",
                title: "Your Dashboard",
                description: "Track ratings, spot trends, and see what customers really think."
              }
            ].map((step, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-8 h-8 bg-[#4E74FF] text-white rounded-full flex items-center justify-center font-bold text-sm mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-12 text-center">
            Common Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "How long is the demo?",
                a: "15 minutes. We respect your time — it's a focused walkthrough, not a sales pitch."
              },
              {
                q: "Do I need to prepare anything?",
                a: "Nope. Just show up. We'll walk you through everything and answer any questions."
              },
              {
                q: "Is there a free trial?",
                a: "Yes. After the demo, you can try Chatters free for 14 days with your own venue."
              },
              {
                q: "What if I have multiple locations?",
                a: "Perfect — Chatters is built for multi-site operators. We'll show you the group dashboard."
              },
              {
                q: "How quickly can I go live?",
                a: "Same day. Print QR codes, stick them on tables, done. No hardware or app downloads needed."
              }
            ].map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Ready to protect your ratings?
          </h2>
          <p className="text-gray-400 mb-8">
            Join hundreds of UK venues using Chatters to catch problems before they become 1-star reviews.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            Book Your Walkthrough
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DemoPage;
