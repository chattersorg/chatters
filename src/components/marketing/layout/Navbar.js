// components/marketing/layout/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import PrimaryButton from '../common/buttons/PrimaryButton';
import { getDashboardUrl } from '../../../utils/domainUtils';

const Navbar = ({ overlay = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownTimer, setDropdownTimer] = useState(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Product dropdown structure with descriptions
  const productCategories = [
    {
      title: 'Core',
      links: [
        { name: 'Real-Time Alerts', path: '/product/real-time-alerts', desc: 'Instant notifications for guest issues' },
        { name: 'Kiosk Mode', path: '/product/kiosk-mode', desc: 'Live dashboard for front-of-house' },
        { name: 'Live Feedback Dashboard', path: '/product/live-feedback-dashboard', desc: 'Real-time feed of all feedback' },
        { name: 'Review Boosting', path: '/product/review-boosting', desc: 'Turn happy guests into 5-star reviews' },
        { name: 'Question Management', path: '/product/question-management', desc: 'Custom feedback forms' },
      ],
    },
    {
      title: 'Team',
      links: [
        { name: 'Staff Leaderboard', path: '/product/staff-leaderboard', desc: 'Track team performance' },
        { name: 'Staff Recognition', path: '/product/staff-recognition', desc: 'Automated appreciation emails' },
        { name: 'Staff Metrics', path: '/product/staff-metrics', desc: 'Individual performance analytics' },
      ],
    },
    {
      title: 'Multi-Site',
      links: [
        { name: 'Multi-Location Control', path: '/product/multi-location-control', desc: 'Centralised venue management' },
        { name: 'Multi-Venue Analytics', path: '/product/multi-venue-analytics', desc: 'Cross-location comparisons' },
      ],
    },
    {
      title: 'Intelligence',
      links: [
        { name: 'Chatters Intelligence', path: '/product/intelligence', desc: 'AI-powered feedback insights' },
        { name: 'Business Intelligence', path: '/product/business-intelligence', desc: 'Advanced analytics & reports' },
        { name: 'NPS Scoring', path: '/product/nps-scoring', desc: 'Net Promoter Score tracking' },
        { name: 'Customer Trends', path: '/product/customer-trends', desc: 'Spot patterns over time' },
      ],
    },
  ];

  // Solutions dropdown structure with descriptions
  const solutionsLinks = [
    { name: 'Restaurants', path: '/solutions/restaurants', desc: 'Optimise dining experiences' },
    { name: 'Pubs & Bars', path: '/solutions/pubs-bars', desc: 'Built for high-volume service' },
    { name: 'Hotels', path: '/solutions/hotels', desc: 'Enhance guest satisfaction' },
  ];

  // Resources dropdown structure with descriptions
  const resourcesLinks = [
    { name: 'Help Center', path: '/help', desc: 'Guides and support articles' },
    { name: 'Blog', path: '/blog', desc: 'Industry insights and tips' },
    { name: 'Changelog', path: 'https://chatters.canny.io/changelog', desc: 'Latest product updates' },
  ];

  const handleDropdownEnter = (dropdown) => {
    if (dropdownTimer) {
      clearTimeout(dropdownTimer);
      setDropdownTimer(null);
    }
    setActiveDropdown(dropdown);
  };

  const handleDropdownLeave = () => {
    const timer = setTimeout(() => setActiveDropdown(null), 150);
    setDropdownTimer(timer);
  };

  const handleDropdownContentEnter = () => {
    if (dropdownTimer) {
      clearTimeout(dropdownTimer);
      setDropdownTimer(null);
    }
  };

  const handleDropdownContentLeave = () => {
    const timer = setTimeout(() => setActiveDropdown(null), 150);
    setDropdownTimer(timer);
  };

  // Product Dropdown - 4-column layout, positioned under nav item
  const ProductDropdown = ({ isVisible }) => {
    return (
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 z-[60] transition-all duration-200 ease-out ${
          isVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1 pointer-events-none'
        }`}
        onMouseEnter={handleDropdownContentEnter}
        onMouseLeave={handleDropdownContentLeave}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6">
          <div className="grid grid-cols-4 gap-8" style={{ width: '800px' }}>
            {productCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {category.title}
                </h3>
                <ul className="space-y-3">
                  {category.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        className="block group"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <span className="text-sm font-medium text-gray-900 group-hover:text-[#41C74E] transition-colors duration-150">
                          {link.name}
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {link.desc}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Solutions Dropdown - 3-column layout
  const SolutionsDropdown = ({ isVisible }) => {
    return (
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 z-[60] transition-all duration-200 ease-out ${
          isVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1 pointer-events-none'
        }`}
        onMouseEnter={handleDropdownContentEnter}
        onMouseLeave={handleDropdownContentLeave}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6">
          <div className="grid grid-cols-3 gap-6" style={{ width: '480px' }}>
            {solutionsLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block group"
                onClick={() => setActiveDropdown(null)}
              >
                <span className="text-sm font-medium text-gray-900 group-hover:text-[#41C74E] transition-colors duration-150">
                  {link.name}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {link.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Resources Dropdown - 3-column layout
  const ResourcesDropdown = ({ isVisible }) => {
    return (
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 z-[60] transition-all duration-200 ease-out ${
          isVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1 pointer-events-none'
        }`}
        onMouseEnter={handleDropdownContentEnter}
        onMouseLeave={handleDropdownContentLeave}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6">
          <div className="grid grid-cols-3 gap-6" style={{ width: '480px' }}>
            {resourcesLinks.map((link) =>
              link.path.startsWith('http') ? (
                <a
                  key={link.name}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                  onClick={() => setActiveDropdown(null)}
                >
                  <span className="text-sm font-medium text-gray-900 group-hover:text-[#41C74E] transition-colors duration-150">
                    {link.name}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {link.desc}
                  </span>
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block group"
                  onClick={() => setActiveDropdown(null)}
                >
                  <span className="text-sm font-medium text-gray-900 group-hover:text-[#41C74E] transition-colors duration-150">
                    {link.name}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {link.desc}
                  </span>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav className='fixed top-0 inset-x-0 z-50 font-satoshi bg-white border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex-shrink-0">
              <img src="/img/chatters_logo_new.svg" alt="Chatters Logo" className="h-6" />
            </Link>

            <div className="hidden lg:flex lg:items-center lg:space-x-6">
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter('product')}
                onMouseLeave={handleDropdownLeave}
              >
                <div className="text-sm font-medium text-gray-700 hover:text-[#41C74E] flex items-center cursor-pointer transition-colors duration-150 py-5">
                  Product <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${activeDropdown === 'product' ? 'rotate-180' : ''}`} />
                </div>
                <ProductDropdown isVisible={activeDropdown === 'product'} />
              </div>

              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter('solutions')}
                onMouseLeave={handleDropdownLeave}
              >
                <div className="text-sm font-medium text-gray-700 hover:text-[#41C74E] flex items-center cursor-pointer transition-colors duration-150 py-5">
                  Solutions <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180' : ''}`} />
                </div>
                <SolutionsDropdown isVisible={activeDropdown === 'solutions'} />
              </div>

              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter('resources')}
                onMouseLeave={handleDropdownLeave}
              >
                <div className="text-sm font-medium text-gray-700 hover:text-[#41C74E] flex items-center cursor-pointer transition-colors duration-150 py-5">
                  Resources <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                </div>
                <ResourcesDropdown isVisible={activeDropdown === 'resources'} />
              </div>

              <Link
                to="/pricing"
                className={`text-sm font-medium transition-colors duration-150 py-5 ${isActive('/pricing') ? 'text-[#41C74E]' : 'text-gray-700 hover:text-[#41C74E]'}`}
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Right: Auth */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <Link
              to={getDashboardUrl('/signin')}
              className="text-sm font-medium text-gray-700 hover:text-[#41C74E] transition-colors duration-150"
            >
              Log in
            </Link>
            <PrimaryButton text="Book a Demo" to="/demo" size="sm" />
          </div>

          {/* Mobile toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            {/* Product Categories */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Product</p>
              <div className="space-y-4">
                {productCategories.map((category) => (
                  <div key={category.title}>
                    <p className="text-xs font-medium text-gray-500 mb-2">{category.title}</p>
                    <div className="space-y-2 pl-3">
                      {category.links.map((link) => (
                        <Link
                          key={link.name}
                          to={link.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block"
                        >
                          <span className="text-sm text-gray-700 hover:text-[#41C74E]">{link.name}</span>
                          <span className="block text-xs text-gray-400">{link.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Solutions</p>
              <div className="space-y-2 pl-3">
                {solutionsLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block"
                  >
                    <span className="text-sm text-gray-700 hover:text-[#41C74E]">{link.name}</span>
                    <span className="block text-xs text-gray-400">{link.desc}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resources</p>
              <div className="space-y-2 pl-3">
                {resourcesLinks.map((link) =>
                  link.path.startsWith('http') ? (
                    <a
                      key={link.name}
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <span className="text-sm text-gray-700 hover:text-[#41C74E]">{link.name}</span>
                      <span className="block text-xs text-gray-400">{link.desc}</span>
                    </a>
                  ) : (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block"
                    >
                      <span className="text-sm text-gray-700 hover:text-[#41C74E]">{link.name}</span>
                      <span className="block text-xs text-gray-400">{link.desc}</span>
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* Pricing & Auth */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <Link
                to="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-medium text-gray-700 hover:text-[#41C74E]"
              >
                Pricing
              </Link>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to={getDashboardUrl('/signin')}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Log in
                </Link>
                <div onClick={() => setIsMobileMenuOpen(false)}>
                  <PrimaryButton text="Book a Demo" to="/demo" size="sm" className="w-full justify-center" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
