import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import CTAButton from '../../components/marketing/common/buttons/CTAButton';

const NewSite = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const closeTimeoutRef = React.useRef(null);

  const handleMouseEnterNav = (dropdown) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(dropdown);
  };

  const handleMouseLeaveNav = () => {
    // Set a small delay before closing
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 100);
  };

  const handleMouseEnterDropdown = () => {
    // Clear any pending close timeout when entering dropdown
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveDropdown = () => {
    setOpenDropdown(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Chatters</title>
      </Helmet>

      {/* Navbar */}
      <nav className="w-full border-b border-gray-200 font-jakarta relative">
        <div className="w-full px-[30px] py-4">
          <div className="flex items-center justify-between">
            {/* Left side: Logo + Nav Links */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <img
                  src="/img/chatters_logo_new.svg"
                  alt="Chatters"
                  className="h-8 w-auto"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-8">
                {/* Product Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnterNav('product')}
                  onMouseLeave={handleMouseLeaveNav}
                >
                  <button
                    className={`flex items-center gap-1 transition-colors text-sm font-medium ${
                      openDropdown === 'product' ? 'text-black' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    Product
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      openDropdown === 'product' ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {/* Invisible hover bridge */}
                  {openDropdown === 'product' && (
                    <div className="absolute top-full left-0 right-0 h-4 bg-transparent" />
                  )}
                </div>

                {/* Solutions Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnterNav('solutions')}
                  onMouseLeave={handleMouseLeaveNav}
                >
                  <button
                    className={`flex items-center gap-1 transition-colors text-sm font-medium ${
                      openDropdown === 'solutions' ? 'text-black' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    Solutions
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      openDropdown === 'solutions' ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {/* Invisible hover bridge */}
                  {openDropdown === 'solutions' && (
                    <div className="absolute top-full left-0 right-0 h-4 bg-transparent" />
                  )}
                </div>

                {/* Resources Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnterNav('resources')}
                  onMouseLeave={handleMouseLeaveNav}
                >
                  <button
                    className={`flex items-center gap-1 transition-colors text-sm font-medium ${
                      openDropdown === 'resources' ? 'text-black' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    Resources
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      openDropdown === 'resources' ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {/* Invisible hover bridge */}
                  {openDropdown === 'resources' && (
                    <div className="absolute top-full left-0 right-0 h-4 bg-transparent" />
                  )}
                </div>

                <Link
                  to="/pricing"
                  className="text-gray-700 hover:text-black transition-colors text-sm font-medium"
                >
                  Pricing
                </Link>
                <Link
                  to="/help"
                  className="text-gray-700 hover:text-black transition-colors text-sm font-medium"
                >
                  Help
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
              <CTAButton to="/demo">
                Take a tour
              </CTAButton>
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
              <div className="space-y-2">
                {/* Product Dropdown */}
                <div>
                  <button
                    onClick={() => setOpenMobileDropdown(openMobileDropdown === 'product' ? null : 'product')}
                    className="w-full flex items-center justify-between text-gray-700 hover:text-black transition-colors text-sm font-medium py-2"
                  >
                    Product
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      openMobileDropdown === 'product' ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {openMobileDropdown === 'product' && (
                    <div className="pl-4 space-y-2 mt-2">
                      <Link to="/product1" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Product 1</Link>
                      <Link to="/product2" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Product 2</Link>
                      <Link to="/product3" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Product 3</Link>
                      <Link to="/product4" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Product 4</Link>
                    </div>
                  )}
                </div>

                {/* Solutions Dropdown */}
                <div>
                  <button
                    onClick={() => setOpenMobileDropdown(openMobileDropdown === 'solutions' ? null : 'solutions')}
                    className="w-full flex items-center justify-between text-gray-700 hover:text-black transition-colors text-sm font-medium py-2"
                  >
                    Solutions
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      openMobileDropdown === 'solutions' ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {openMobileDropdown === 'solutions' && (
                    <div className="pl-4 space-y-2 mt-2">
                      <Link to="/solution1" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Solution 1</Link>
                      <Link to="/solution2" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Solution 2</Link>
                      <Link to="/solution3" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Solution 3</Link>
                      <Link to="/solution4" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Solution 4</Link>
                    </div>
                  )}
                </div>

                {/* Resources Dropdown */}
                <div>
                  <button
                    onClick={() => setOpenMobileDropdown(openMobileDropdown === 'resources' ? null : 'resources')}
                    className="w-full flex items-center justify-between text-gray-700 hover:text-black transition-colors text-sm font-medium py-2"
                  >
                    Resources
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      openMobileDropdown === 'resources' ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {openMobileDropdown === 'resources' && (
                    <div className="pl-4 space-y-2 mt-2">
                      <Link to="/resource1" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Resource 1</Link>
                      <Link to="/resource2" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Resource 2</Link>
                      <Link to="/resource3" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Resource 3</Link>
                      <Link to="/resource4" className="block text-sm text-gray-600 hover:text-[#2F5CFF] py-1.5">Resource 4</Link>
                    </div>
                  )}
                </div>

                <Link
                  to="/pricing"
                  className="block text-gray-700 hover:text-black transition-colors text-sm font-medium py-2"
                >
                  Pricing
                </Link>
                <Link
                  to="/help"
                  className="block text-gray-700 hover:text-black transition-colors text-sm font-medium py-2"
                >
                  Help
                </Link>
              </div>
              <div className="pt-3 space-y-2 border-t border-gray-200">
                <Link
                  to="/login"
                  className="block text-gray-700 hover:text-black transition-colors text-sm font-semibold py-2"
                >
                  Log in
                </Link>
                <CTAButton to="/demo" className="w-full justify-center">
                  Take a tour
                </CTAButton>
              </div>
            </div>
          )}
        </div>

        {/* Full-Width Dropdown Panels - Added padding-top as buffer zone */}
        <div
          className={`absolute left-0 right-0 top-full bg-white border-b border-gray-200 transition-all duration-300 ease-in-out ${
            openDropdown ? 'translate-y-0 opacity-100 visible' : '-translate-y-4 opacity-0 invisible'
          }`}
          style={{ paddingTop: '1px' }} // Invisible buffer to prevent gaps
          onMouseEnter={handleMouseEnterDropdown}
          onMouseLeave={handleMouseLeaveDropdown}
        >
          {/* Product Dropdown Content */}
          {openDropdown === 'product' && (
            <div className="w-full px-[30px] py-12">
              <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8">
                {/* Column 1 */}
                <div className="space-y-6">
                  <Link to="/product1" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Product 1</h3>
                    <p className="text-sm text-gray-600">Description for Product 1 goes here</p>
                  </Link>
                  <Link to="/product2" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Product 2</h3>
                    <p className="text-sm text-gray-600">Description for Product 2 goes here</p>
                  </Link>
                </div>
                {/* Column 2 */}
                <div className="space-y-6">
                  <Link to="/product3" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Product 3</h3>
                    <p className="text-sm text-gray-600">Description for Product 3 goes here</p>
                  </Link>
                  <Link to="/product4" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Product 4</h3>
                    <p className="text-sm text-gray-600">Description for Product 4 goes here</p>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Solutions Dropdown Content */}
          {openDropdown === 'solutions' && (
            <div className="w-full px-[30px] py-12">
              <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8">
                {/* Column 1 */}
                <div className="space-y-6">
                  <Link to="/solution1" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Solution 1</h3>
                    <p className="text-sm text-gray-600">Description for Solution 1 goes here</p>
                  </Link>
                  <Link to="/solution2" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Solution 2</h3>
                    <p className="text-sm text-gray-600">Description for Solution 2 goes here</p>
                  </Link>
                </div>
                {/* Column 2 */}
                <div className="space-y-6">
                  <Link to="/solution3" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Solution 3</h3>
                    <p className="text-sm text-gray-600">Description for Solution 3 goes here</p>
                  </Link>
                  <Link to="/solution4" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Solution 4</h3>
                    <p className="text-sm text-gray-600">Description for Solution 4 goes here</p>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Resources Dropdown Content */}
          {openDropdown === 'resources' && (
            <div className="w-full px-[30px] py-12">
              <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8">
                {/* Column 1 */}
                <div className="space-y-6">
                  <Link to="/resource1" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Resource 1</h3>
                    <p className="text-sm text-gray-600">Description for Resource 1 goes here</p>
                  </Link>
                  <Link to="/resource2" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Resource 2</h3>
                    <p className="text-sm text-gray-600">Description for Resource 2 goes here</p>
                  </Link>
                </div>
                {/* Column 2 */}
                <div className="space-y-6">
                  <Link to="/resource3" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Resource 3</h3>
                    <p className="text-sm text-gray-600">Description for Resource 3 goes here</p>
                  </Link>
                  <Link to="/resource4" className="block group dropdown-item">
                    <h3 className="text-lg font-semibold text-black mb-1 group-hover:text-[#2F5CFF] transition-colors">Resource 4</h3>
                    <p className="text-sm text-gray-600">Description for Resource 4 goes here</p>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="h-[50vh] flex items-center justify-center px-[30px] py-12">
        <div className="max-w-5xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-black mb-6 leading-[1.2]">
            <span className="text-[#2F5CFF]">AI-Powered intelligence</span> that<br />
            transforms feedback into action
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-base md:text-lg text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            Stop drowning in data. Let AI analyse thousands of customer responses instantly,
            identify critical trends, and deliver actionable recommendations that drive real business results.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <CTAButton to="/pricing" variant="secondary" className="w-full sm:w-auto">
              Pricing
            </CTAButton>
            <CTAButton to="/demo" className="w-full sm:w-auto">
              Take a tour
            </CTAButton>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-[30px] bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Features Grid */}
          <FeaturesGrid />
        </div>
      </div>
    </div>
  );
};

// Features Grid Component
const FeaturesGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Feature 1 - Large */}
      <FeatureBlock
        title="Real-time Analytics"
        description="Monitor customer sentiment as it happens with live dashboards and instant alerts."
        to="/features/analytics"
        className="lg:col-span-2"
      />

      {/* Feature 2 - Small */}
      <FeatureBlock
        title="Smart Insights"
        description="AI-powered recommendations that turn data into actionable strategies."
        to="/features/insights"
        highlighted={true}
      />

      {/* Feature 3 - Small */}
      <FeatureBlock
        title="Multi-channel"
        description="Collect feedback across all touchpoints in one unified platform."
        to="/features/channels"
      />

      {/* Feature 4 - Large */}
      <FeatureBlock
        title="Custom Reports"
        description="Generate beautiful, shareable reports tailored to your business needs."
        to="/features/reports"
        className="lg:col-span-2"
      />
    </div>
  );
};

// Feature Block Component
const FeatureBlock = ({ title, description, to, className = '', highlighted = false }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Link
      to={to}
      className={`group relative bg-[#EEECED] rounded-2xl p-8 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Title with Arrow */}
        <div className="flex items-center gap-3 mb-4">
          <h3 className={`text-2xl font-medium transition-colors ${
            highlighted ? 'text-[#2F5CFF]' : 'text-black'
          }`}>
            {title}
          </h3>
          {/* Sliding Arrow */}
          <div className="relative w-6 h-6 overflow-hidden">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`absolute transition-all duration-300 ease-in-out ${
                isHovered ? 'translate-x-8 opacity-0' : 'translate-x-0 opacity-100'
              }`}
            >
              <path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#2F5CFF]"
              />
            </svg>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`absolute transition-all duration-300 ease-in-out ${
                isHovered ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
              }`}
            >
              <path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#2F5CFF]"
              />
            </svg>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};

export default NewSite;
