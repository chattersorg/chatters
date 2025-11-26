// components/marketing/layout/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, BarChart3, Utensils, Building, ShoppingBag, Calendar, BookOpen, HelpCircle, FileText, GraduationCap, Trophy, Globe, Monitor, Bell, TrendingUp, Sparkles, Brain, Zap } from 'lucide-react';
import PrimaryButton from '../common/buttons/PrimaryButton';
import { getDashboardUrl, isDevSite } from '../../../utils/domainUtils';

const Navbar = ({ overlay = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownTimer, setDropdownTimer] = useState(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Core Features Column
  const coreProductLinks = [
    { name: 'Question Management', path: '/product/question-management', description: 'Custom feedback forms and intelligent question flows', icon: <HelpCircle className="w-5 h-5" /> },
    { name: 'Business Intelligence', path: '/product/business-intelligence', description: 'Advanced analytics and performance insights', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'NPS Scoring', path: '/product/nps-scoring', description: 'Track Net Promoter Score and customer loyalty metrics', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'Real-Time Alerts', path: '/product/real-time-alerts', description: 'Instant notifications and emergency escalation', icon: <Bell className="w-5 h-5" /> },
  ];

  // Team & Growth Column
  const teamProductLinks = [
    { name: 'Staff Leaderboard', path: '/product/staff-leaderboard', description: 'Track and celebrate team performance achievements', icon: <Trophy className="w-5 h-5" /> },
    { name: 'Staff Recognition', path: '/product/staff-recognition', description: 'Reward top performers with automated recognition emails', icon: <Trophy className="w-5 h-5" /> },
    { name: 'Multi-Location Control', path: '/product/multi-location-control', description: 'Centralised management for restaurant/hotel chains', icon: <Globe className="w-5 h-5" /> },
    { name: 'Kiosk Mode', path: '/product/kiosk-mode', description: 'Tablet-based feedback stations and self-service', icon: <Monitor className="w-5 h-5" /> },
  ];

  // Chatters Intelligence Column (Full Height)
  const intelligenceLink = {
    name: 'Chatters Intelligence',
    path: '/product/intelligence',
    description: 'AI-powered insights from your customer feedback',
    longDescription: 'Harness the power of AI to transform customer feedback into actionable intelligence. Get instant insights, identify trends, and make data-driven decisions with confidence.',
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      { icon: <Brain className="w-4 h-4" />, text: 'AI-Powered Analysis' },
      { icon: <TrendingUp className="w-4 h-4" />, text: 'Predictive Insights' },
      { icon: <Zap className="w-4 h-4" />, text: 'Instant Recommendations' },
    ]
  };

  const solutionsLinks = [
    { name: 'Restaurants', path: '/solutions/restaurants', description: 'Optimise dining experiences', icon: <Utensils className="w-5 h-5" /> },
    { name: 'Hotels', path: '/solutions/hotels', description: 'Enhance guest satisfaction', icon: <Building className="w-5 h-5" /> },
    { name: 'Retail', path: '/solutions/retail', description: 'Improve customer service', icon: <ShoppingBag className="w-5 h-5" /> },
    { name: 'Events', path: '/solutions/events', description: 'Perfect event feedback', icon: <Calendar className="w-5 h-5" /> },
  ];

  const resourcesLinks = [
    { name: 'Documentation', path: 'https://chatters.canny.io/changelog', description: 'Learn how to use Chatters', icon: <BookOpen className="w-5 h-5" /> },
    { name: 'Help Center', path: '/help', description: 'Get support when you need it', icon: <HelpCircle className="w-5 h-5" /> },
    { name: 'Blog', path: '/blog', description: 'Industry insights and tips', icon: <FileText className="w-5 h-5" /> },
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

  // Product Dropdown with Three Columns
  const ProductDropdown = ({ isVisible }) => {
    return (
      <div
        className={`fixed left-0 right-0 top-16 z-[60] transition-all duration-400 ease-out transform ${
          isVisible ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible -translate-y-4 scale-95'
        }`}
        onMouseEnter={handleDropdownContentEnter}
        onMouseLeave={handleDropdownContentLeave}
      >
        <div className="w-full bg-white border-b border-gray-200 shadow-2xl py-8">
          <div className="px-8">
            <div className="grid grid-cols-3 gap-8">
              {/* Column 1: Core Features */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Core Features</h3>
                <div className="space-y-2">
                  {coreProductLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-[#FF6D6D]/10 rounded-lg flex items-center justify-center text-[#FF6D6D] group-hover:bg-[#FF6D6D] group-hover:text-white transition-all duration-200">
                        {link.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-satoshi font-semibold text-gray-900 group-hover:text-[#FF6D6D] transition-colors duration-200 text-sm mb-1">
                          {link.name}
                        </div>
                        <div className="text-xs text-gray-600 font-satoshi leading-relaxed">
                          {link.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 2: Team & Growth */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Team & Growth</h3>
                <div className="space-y-2">
                  {teamProductLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-[#FF6D6D]/10 rounded-lg flex items-center justify-center text-[#FF6D6D] group-hover:bg-[#FF6D6D] group-hover:text-white transition-all duration-200">
                        {link.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-satoshi font-semibold text-gray-900 group-hover:text-[#FF6D6D] transition-colors duration-200 text-sm mb-1">
                          {link.name}
                        </div>
                        <div className="text-xs text-gray-600 font-satoshi leading-relaxed">
                          {link.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 3: Chatters Intelligence (Full Height) */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
              <Link
                to={intelligenceLink.path}
                onClick={() => setActiveDropdown(null)}
                className="group block h-full"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    {intelligenceLink.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-satoshi font-bold text-base mb-1 bg-clip-text text-transparent bg-gradient-to-r from-[#FF6D6D] via-[#FFAC4E] to-[#FF6D6D] bg-[length:200%_auto] animate-gradient">
                      {intelligenceLink.name}
                    </h3>
                    <p className="text-xs text-gray-600 font-satoshi">
                      {intelligenceLink.description}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-700 font-satoshi leading-relaxed mb-4">
                  {intelligenceLink.longDescription}
                </p>

                <div className="space-y-2">
                  {intelligenceLink.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                      <div className="flex-shrink-0 w-5 h-5 bg-white/60 rounded-md flex items-center justify-center text-purple-600">
                        {feature.icon}
                      </div>
                      <span className="font-satoshi font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

              </Link>

              <div className="mt-4 pt-4 border-t border-purple-200 flex gap-2">
                <a
                  href="/pricing"
                  onClick={() => setActiveDropdown(null)}
                  className="group flex-1 inline-flex items-center justify-center bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 font-satoshi shadow-sm hover:shadow border border-gray-200 overflow-hidden relative px-3 py-2 text-xs"
                >
                  <span>View Pricing</span>
                  <span className="relative ml-1.5 w-3 h-3 overflow-hidden inline-block">
                    <svg className="w-3 h-3 absolute top-0 left-0 transition-all duration-300 group-hover:translate-x-6 group-hover:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <svg className="w-3 h-3 absolute top-0 left-0 -translate-x-6 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </a>
                <a
                  href="/demo"
                  onClick={() => setActiveDropdown(null)}
                  className="group flex-1 inline-flex items-center justify-center bg-[#41C74E] text-white rounded-lg font-semibold hover:bg-[#38b043] transition-all duration-200 font-satoshi shadow-lg hover:shadow-xl overflow-hidden relative px-3 py-2 text-xs"
                >
                  <span>Book a Demo</span>
                  <span className="relative ml-1.5 w-3 h-3 overflow-hidden inline-block">
                    <svg className="w-3 h-3 absolute top-0 left-0 transition-all duration-300 group-hover:translate-x-6 group-hover:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <svg className="w-3 h-3 absolute top-0 left-0 -translate-x-6 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DropdownContent = ({ links, isVisible, colorScheme = 'green' }) => {
    const getColorClasses = () => {
      switch (colorScheme) {
        case 'purple':
          return { bg: 'bg-[#FFAC4E]/10', text: 'text-[#FFAC4E]', hover: 'group-hover:bg-[#FFAC4E]', hoverText: 'group-hover:text-[#FFAC4E]' };
        case 'blue':
          return { bg: 'bg-[#41C74E]/10', text: 'text-[#41C74E]', hover: 'group-hover:bg-[#41C74E]', hoverText: 'group-hover:text-[#41C74E]' };
        default:
          return { bg: 'bg-green-100', text: 'text-green-600', hover: 'group-hover:bg-green-600', hoverText: 'group-hover:text-green-600' };
      }
    };
    const colors = getColorClasses();

    return (
      <div
        className={`fixed left-0 right-0 top-16 z-[60] transition-all duration-400 ease-out transform ${
          isVisible ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible -translate-y-4 scale-95'
        }`}
        onMouseEnter={handleDropdownContentEnter}
        onMouseLeave={handleDropdownContentLeave}
      >
        <div className="w-full bg-white border-b border-gray-200 shadow-2xl py-8">
          <div className="px-8">
            <div className="grid grid-cols-2 gap-6">
              {links.map((link) =>
                link.path.startsWith('http') ? (
                  <a
                    key={link.name}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setActiveDropdown(null)}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.text} ${colors.hover} group-hover:text-white transition-all duration-200`}>
                      {link.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-satoshi font-semibold text-gray-900 transition-colors duration-200 text-sm mb-1 ${colors.hoverText}`}>
                        {link.name}
                      </div>
                      <div className="text-xs text-gray-600 font-satoshi leading-relaxed">
                        {link.description}
                      </div>
                    </div>
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setActiveDropdown(null)}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.text} ${colors.hover} group-hover:text-white transition-all duration-200`}>
                      {link.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-satoshi font-semibold text-gray-900 transition-colors duration-200 text-sm mb-1 ${colors.hoverText}`}>
                        {link.name}
                      </div>
                      <div className="text-xs text-gray-600 font-satoshi leading-relaxed">
                        {link.description}
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav className='fixed top-0 inset-x-0 z-50 font-satoshi bg-white border-b border-gray-200'>
      <div className='w-full px-8'>
        <div>
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo + Desktop Nav */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex-shrink-0">
                <img src="/img/chatters_logo_new.svg" alt="Chatters Logo" className="h-6" />
              </Link>

              <div className="hidden lg:flex lg:items-center lg:space-x-8 relative">
                <div
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter('product')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className="text-sm font-semibold text-black hover:text-green-600 flex items-center cursor-pointer transition-colors duration-200 font-satoshi">
                    Product <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${activeDropdown === 'product' ? 'rotate-180' : ''}`} />
                  </div>
                  <ProductDropdown isVisible={activeDropdown === 'product'} />
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter('solutions')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className="text-sm font-semibold text-black hover:text-green-600 flex items-center cursor-pointer transition-colors duration-200 font-satoshi">
                    Solutions <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180' : ''}`} />
                  </div>
                  <DropdownContent links={solutionsLinks} isVisible={activeDropdown === 'solutions'} colorScheme="purple" />
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter('resources')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className="text-sm font-semibold text-black hover:text-green-600 flex items-center cursor-pointer transition-colors duration-200 font-satoshi">
                    Resources <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                  </div>
                  <DropdownContent links={resourcesLinks} isVisible={activeDropdown === 'resources'} colorScheme="blue" />
                </div>

                <Link
                  to="/pricing"
                  className={`text-sm font-semibold transition-colors duration-200 font-satoshi ${isActive('/pricing') ? 'text-green-600' : 'text-black hover:text-green-600'}`}
                >
                  Pricing
                </Link>
              </div>
            </div>

            {/* Right: Auth */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              <Link
                to={getDashboardUrl('/signin')}
                className="text-sm font-semibold text-black hover:text-green-600 transition-colors duration-200 font-satoshi"
              >
                Log in
              </Link>
              <PrimaryButton text="Book a Demo" to="/demo" size="sm" />
            </div>

            {/* Mobile toggle */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-black focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="px-4 pt-4 pb-6 space-y-4 font-satoshi">
            <div>
              <p className="text-sm font-semibold text-green-600 mb-2">Product - Core Features</p>
              <div className="grid grid-cols-2 gap-2">
                {coreProductLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-start space-y-2 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      {link.icon}
                    </div>
                    <div className="text-xs font-medium text-black text-left">{link.name}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-green-600 mb-2">Product - Team & Growth</p>
              <div className="grid grid-cols-2 gap-2">
                {teamProductLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-start space-y-2 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      {link.icon}
                    </div>
                    <div className="text-xs font-medium text-black text-left">{link.name}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
              <Link
                to={intelligenceLink.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                    {intelligenceLink.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-satoshi font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-[#FF6D6D] via-[#FFAC4E] to-[#FF6D6D] bg-[length:200%_auto] animate-gradient">
                      {intelligenceLink.name}
                    </h3>
                    <p className="text-xs text-gray-600 font-satoshi">
                      {intelligenceLink.description}
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            <div>
              <p className="text-sm font-semibold text-purple-600 mb-2">Solutions</p>
              <div className="grid grid-cols-2 gap-2">
                {solutionsLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-start space-y-2 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      {link.icon}
                    </div>
                    <div className="text-xs font-medium text-black text-left">{link.name}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600 mb-2">Resources</p>
              <div className="grid grid-cols-2 gap-2">
                {resourcesLinks.map((link) =>
                  link.path.startsWith('http') ? (
                    <a
                      key={link.name}
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-start space-y-2 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        {link.icon}
                      </div>
                      <div className="text-xs font-medium text-black text-left">{link.name}</div>
                    </a>
                  ) : (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex flex-col items-start space-y-2 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        {link.icon}
                      </div>
                      <div className="text-xs font-medium text-black text-left">{link.name}</div>
                    </Link>
                  )
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 space-y-3">
              <Link
                to="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center text-sm font-semibold text-black py-2"
              >
                Pricing
              </Link>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={getDashboardUrl('/signin')}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center border border-gray-300 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
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