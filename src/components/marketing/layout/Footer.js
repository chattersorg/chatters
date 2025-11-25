import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Adjust grid for 5 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12">
          {/* Brand / About */}
          <div>
            <img
              src="/img/Logo.svg"
              alt="Chatters"
              className="h-8 w-auto mb-4 filter invert"
            />
            <p className="text-gray-400 leading-relaxed font-satoshi">
              The leading feedback management platform for hospitality
              businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-lg font-semibold mb-4 font-satoshi">Product</h4>
            <ul className="space-y-2 text-gray-400 font-satoshi">
              <li>
                <a
                  href="/product/question-management"
                  className="hover:text-white transition-colors"
                >
                  Question Management
                </a>
              </li>
              <li>
                <a
                  href="/product/business-intelligence"
                  className="hover:text-white transition-colors"
                >
                  Business Intelligence
                </a>
              </li>
              <li>
                <a
                  href="/product/automation-workflow"
                  className="hover:text-white transition-colors"
                >
                  Automation & Workflows
                </a>
              </li>
              <li>
                <a
                  href="/product/multi-location"
                  className="hover:text-white transition-colors"
                >
                  Multi Location
                </a>
              </li>
              <li>
                <a
                  href="/product/kiosk-mode"
                  className="hover:text-white transition-colors"
                >
                  Kiosk Mode
                </a>
              </li>
              <li>
                <a
                  href="/product/real-time-alerts"
                  className="hover:text-white transition-colors"
                >
                  Real Time Alerts
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-lg font-semibold mb-4 font-satoshi">
              Solutions
            </h4>
            <ul className="space-y-2 text-gray-400 font-satoshi">
              <li>
                <a
                  href="/solutions/restaurants"
                  className="hover:text-white transition-colors"
                >
                  Restaurants
                </a>
              </li>
              <li>
                <a
                  href="/solutions/hotels"
                  className="hover:text-white transition-colors"
                >
                  Hotels
                </a>
              </li>
              <li>
                <a
                  href="/solutions/retail"
                  className="hover:text-white transition-colors"
                >
                  Retail
                </a>
              </li>
              <li>
                <a
                  href="/solutions/events"
                  className="hover:text-white transition-colors"
                >
                  Events
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-4 font-satoshi">Company</h4>
            <ul className="space-y-2 text-gray-400 font-satoshi">
              <li>
                <a
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="hover:text-white transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4 font-satoshi">Support</h4>
            <ul className="space-y-2 text-gray-400 font-satoshi">
              <li>
                <a
                  href="/help"
                  className="hover:text-white transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="https://chatters.canny.io/changelog"
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/security"
                  className="hover:text-white transition-colors"
                >
                  Security
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    localStorage.removeItem('chatters_cookie_consent');
                    localStorage.removeItem('chatters_cookie_preferences');
                    window.location.reload();
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 font-satoshi">
            &copy; 2025 Chatters. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors font-satoshi"
            >
              Twitter
            </a>
            <a
              href="https://www.linkedin.com/company/getchatters/"
              className="text-gray-400 hover:text-white transition-colors font-satoshi"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors font-satoshi"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;