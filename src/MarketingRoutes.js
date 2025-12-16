import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CookieBanner from './components/marketing/CookieBanner';
import ScrollToTop from './components/ScrollToTop';

import LandingPage from './pages/marketing/LandingPage';
import PricingPage from './pages/marketing/Pricing';
import FeaturesPage from './pages/marketing/Features';
import ContactPage from './pages/marketing/ContactPage';
import SecurityPage from './pages/marketing/SecurityPage';
import HelpPage from './pages/marketing/HelpPage';
import HelpNewPage from './pages/marketing/HelpNewPage';
import HelpArticleRoute from './pages/marketing/help/HelpArticleRoute';
import TermsAndConditionsPage from './pages/marketing/Terms';
import PrivacyPolicyPage from './pages/marketing/Privacy';
import AboutPage from './pages/marketing/AboutPage';
import DemoPage from './pages/marketing/DemoPage';
import TryPage from './pages/marketing/TryPage';

import BlogPage from './pages/marketing/BlogPage';
import BlogPost from './pages/marketing/BlogPost';

import QuestionManagementProduct from './pages/marketing/product/QuestionManagement';
import BusinessIntelligenceProduct from './pages/marketing/product/BusinessIntelligence';
import IntelligenceProduct from './pages/marketing/product/Intelligence';
import StaffLeaderboardPage from './pages/marketing/product/StaffLeaderboardPage';
import StaffRecognitionPage from './pages/marketing/product/Staff-Recognition';
import StaffMetricsPage from './pages/marketing/product/Staff-Metrics';
import NPSScoringPage from './pages/marketing/product/NPSScoring';
import MultiLocationControlProduct from './pages/marketing/product/Multi-Location-Control';
import MultiVenueAnalyticsPage from './pages/marketing/product/Multi-Venue-Analytics';
import KioskModeProduct from './pages/marketing/product/Kiosk-Mode';
import RealTimeAlertsProduct from './pages/marketing/product/Real-Time-Alerts';
import LiveFeedbackDashboardPage from './pages/marketing/product/Live-Feedback-Dashboard';
import ReviewBoostingPage from './pages/marketing/product/Review-Boosting';
import CustomerTrendsPage from './pages/marketing/product/Customer-Trends';

import RestaurantSolution from './pages/marketing/solutions/RestaurantSolution';
import HotelSolution from './pages/marketing/solutions/HotelSolution';
import RetailSolution from './pages/marketing/solutions/RetailSolution';
import EventSolution from './pages/marketing/solutions/EventSolution';
import PubsBarsSolution from './pages/marketing/solutions/PubsBarsSolution';

import RestaurantsIndustry from './pages/marketing/industries/Restaurants';
import HotelsIndustry from './pages/marketing/industries/Hotels';
import RetailIndustry from './pages/marketing/industries/Retail';
import EventsIndustry from './pages/marketing/industries/Events';

import NewSite from './pages/marketing/NewSite';

const MarketingRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* 🌍 Public Marketing Site */}
        <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/help-new" element={<HelpNewPage />} />
      <Route path="/help/:slug" element={<HelpArticleRoute />} />
      <Route path="/terms" element={<TermsAndConditionsPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/try" element={<TryPage />} />

      {/* 📝 Blog Pages */}
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPost />} />

      {/* 🏢 Product Pages */}
      <Route path="/product/question-management" element={<QuestionManagementProduct />} />
      <Route path="/product/business-intelligence" element={<BusinessIntelligenceProduct />} />
      <Route path="/product/intelligence" element={<IntelligenceProduct />} />
      <Route path="/product/multi-location-control" element={<MultiLocationControlProduct />} />
      <Route path="/product/multi-venue-analytics" element={<MultiVenueAnalyticsPage />} />
      <Route path="/product/kiosk-mode" element={<KioskModeProduct />} />
      <Route path="/product/real-time-alerts" element={<RealTimeAlertsProduct />} />
      <Route path="/product/live-feedback-dashboard" element={<LiveFeedbackDashboardPage />} />
      <Route path="/product/review-boosting" element={<ReviewBoostingPage />} />
      <Route path="/product/staff-leaderboard" element={<StaffLeaderboardPage />} />
      <Route path="/product/staff-recognition" element={<StaffRecognitionPage />} />
      <Route path="/product/staff-metrics" element={<StaffMetricsPage />} />
      <Route path="/product/nps-scoring" element={<NPSScoringPage />} />
      <Route path="/product/customer-trends" element={<CustomerTrendsPage />} />

      {/* 🏢 Solutions Pages */}
      <Route path="/solutions/restaurants" element={<RestaurantSolution />} />
      <Route path="/solutions/hotels" element={<HotelSolution />} />
      <Route path="/solutions/pubs-bars" element={<PubsBarsSolution />} />
      <Route path="/solutions/retail" element={<RetailSolution />} />
      <Route path="/solutions/events" element={<EventSolution />} />

      {/* 🏭 Industry Pages */}
      <Route path="/industries/restaurants" element={<RestaurantsIndustry />} />
      <Route path="/industries/hotels" element={<HotelsIndustry />} />
      <Route path="/industries/retail" element={<RetailIndustry />} />
      <Route path="/industries/events" element={<EventsIndustry />} />

      {/* 🆕 New Site (Rebrand Test) */}
      <Route path="/new-site" element={<NewSite />} />

      </Routes>

      {/* Cookie Consent Banner */}
      <CookieBanner />
    </>
  );
};

export default MarketingRoutes;