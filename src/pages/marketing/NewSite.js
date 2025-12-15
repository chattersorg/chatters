import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Menu, X, Star, TrendingUp, Users, Zap, Shield, BarChart3, MessageSquare, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const NewSite = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-jakarta">
      <Helmet>
        <title>Chatters - Real-Time Customer Feedback Platform</title>
      </Helmet>

      {/* Navbar */}
      <nav className="w-full border-b border-gray-200 relative bg-white">
        <div className="w-full px-[30px] py-6">
          <div className="flex items-center justify-between">
            {/* Left side: Logo + Nav Links */}
            <div className="flex items-end space-x-8">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <img
                  src="/img/chatters_logo_new.svg"
                  alt="Chatters"
                  className="h-8 w-auto"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-end space-x-8">
                <Link
                  to="/features"
                  className="text-gray-700 hover:text-black transition-colors text-sm font-medium"
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className="text-gray-700 hover:text-black transition-colors text-sm font-medium"
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className="text-gray-700 hover:text-black transition-colors text-sm font-medium"
                >
                  About
                </Link>
              </div>
            </div>

            {/* Right side: CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link
                to="/login"
                className="text-gray-700 hover:text-black transition-colors text-sm font-semibold px-4 py-2"
              >
                Log in
              </Link>
              <Link
                to="/demo"
                className="bg-[#4E74FF] text-white px-6 py-2 rounded-lg hover:bg-[#2F5CFF] transition-colors text-sm font-semibold"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-3 border-t border-gray-200 pt-4">
              <Link to="/features" className="block text-gray-700 hover:text-black transition-colors text-sm font-medium py-2">
                Features
              </Link>
              <Link to="/pricing" className="block text-gray-700 hover:text-black transition-colors text-sm font-medium py-2">
                Pricing
              </Link>
              <Link to="/about" className="block text-gray-700 hover:text-black transition-colors text-sm font-medium py-2">
                About
              </Link>
              <div className="pt-3 space-y-2 border-t border-gray-200">
                <Link to="/login" className="block text-gray-700 hover:text-black transition-colors text-sm font-semibold py-2">
                  Log in
                </Link>
                <Link
                  to="/demo"
                  className="block bg-[#4E74FF] text-white px-6 py-2 rounded-lg hover:bg-[#2F5CFF] transition-colors text-sm font-semibold text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-[30px] bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Real-Time Feedback,<br />Real Results
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Capture customer feedback instantly, resolve issues before they become reviews, and boost your team's performance with the leading hospitality feedback platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/demo"
                className="bg-[#4E74FF] text-white px-8 py-4 rounded-lg hover:bg-[#2F5CFF] transition-colors text-base font-semibold flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/pricing"
                className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors text-base font-semibold border-2 border-gray-200"
              >
                View Pricing
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#4E74FF]" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#4E74FF]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#4E74FF]" />
                <span>500+ venues trust Chatters</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 px-[30px] bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-sm text-gray-600">Active Venues</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">2M+</div>
              <div className="text-sm text-gray-600">Feedback Collected</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">94%</div>
              <div className="text-sm text-gray-600">Issue Resolution</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">4.9/5</div>
              <div className="text-sm text-gray-600">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-[30px] bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Stop Losing Customers to Bad Reviews
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Traditional feedback comes too late. By the time you see a negative review, the damage is done.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Too Slow</h3>
              <p className="text-gray-600">
                Survey emails and comment cards take days. Issues fester while customers stay silent.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Visibility</h3>
              <p className="text-gray-600">
                Staff don't know what's wrong until it's public. One bad review damages your reputation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Zero Accountability</h3>
              <p className="text-gray-600">
                No way to track performance or recognize staff who go above and beyond.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-[30px] bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Catch Problems While Customers Are Still On-Site
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chatters puts feedback in your hands instantly, so you can turn problems into wins.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="text-5xl font-bold text-[#FF6D6D] mb-4">01</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Customer Scans QR Code</h3>
              <p className="text-gray-600 leading-relaxed">
                Place QR codes on tables, receipts, or anywhere in your venue. Customers scan and leave feedback in under 30 seconds.
              </p>
            </div>

            <div>
              <div className="text-5xl font-bold text-[#FFAC4E] mb-4">02</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Staff Get Instant Alerts</h3>
              <p className="text-gray-600 leading-relaxed">
                Low ratings trigger real-time notifications. Your team can address issues immediately while the customer is still there.
              </p>
            </div>

            <div>
              <div className="text-5xl font-bold text-[#4E74FF] mb-4">03</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Problems Become Wins</h3>
              <p className="text-gray-600 leading-relaxed">
                Resolve issues on the spot, track who fixed what, and direct happy customers to leave glowing public reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-[30px] bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for hospitality venues that care about every customer interaction
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-gray-900" />}
              title="Real-Time Notifications"
              description="Instant alerts when customers need help. Resolve issues before they leave angry."
            />
            <FeatureCard
              icon={<Star className="w-6 h-6 text-gray-900" />}
              title="Smart Review Routing"
              description="Automatically direct satisfied customers to Google and TripAdvisor."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-gray-900" />}
              title="Performance Analytics"
              description="Track staff performance, resolution times, and satisfaction trends over time."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-gray-900" />}
              title="Staff Leaderboards"
              description="Recognize top performers with automated rankings and recognition emails."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6 text-gray-900" />}
              title="Multi-Location Support"
              description="Manage all your venues from one centralized dashboard with cross-location analytics."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-gray-900" />}
              title="Custom Branding"
              description="White-label feedback forms with your logo, colors, and custom questions."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-[30px] bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Protect Your Online Reputation
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Most customers won't complain - they'll just leave a negative review and never return. Chatters gives them a private channel to voice concerns while you still have a chance to fix things.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4E74FF] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Catch Issues Early</div>
                    <div className="text-gray-600">Get notified the moment a customer has a problem</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4E74FF] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Turn Detractors Into Promoters</div>
                    <div className="text-gray-600">Resolve complaints before they become public reviews</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-[#4E74FF] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Boost Positive Reviews</div>
                    <div className="text-gray-600">Direct happy customers to leave reviews where it matters</div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-900 mb-2">94%</div>
                <div className="text-lg text-gray-600">of issues resolved on-site</div>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-600 italic">
                  "Chatters has transformed how we handle customer feedback. We've prevented dozens of negative reviews by catching issues in real-time."
                </p>
                <div className="mt-4">
                  <div className="font-semibold text-gray-900">Restaurant Manager</div>
                  <div className="text-sm text-gray-600">London Venue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-[30px] bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Customer Experience?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join hundreds of hospitality venues using Chatters to capture feedback, resolve issues instantly, and protect their reputation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/demo"
              className="bg-[#4E74FF] text-white px-8 py-4 rounded-lg hover:bg-[#2F5CFF] transition-colors text-base font-semibold"
            >
              Start Free Trial
            </Link>
            <Link
              to="/pricing"
              className="bg-transparent text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors text-base font-semibold border-2 border-white"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-[30px]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company */}
            <div>
              <img
                src="/img/chatters_logo_new.svg"
                alt="Chatters"
                className="h-8 w-auto mb-4"
              />
              <p className="text-sm text-gray-600">
                Real-time customer feedback for hospitality venues.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link></li>
                <li><Link to="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link></li>
                <li><Link to="/demo" className="text-sm text-gray-600 hover:text-gray-900">Demo</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-sm text-gray-600 hover:text-gray-900">About</Link></li>
                <li><Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</Link></li>
                <li><Link to="/help" className="text-sm text-gray-600 hover:text-gray-900">Help Center</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">Terms of Service</Link></li>
                <li><Link to="/security" className="text-sm text-gray-600 hover:text-gray-900">Security</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © 2025 Chatters. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default NewSite;
