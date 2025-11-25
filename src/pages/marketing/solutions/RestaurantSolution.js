// pages/marketing/solutions/RestaurantSolution.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { Bell, CheckCircle, BarChart3, Shield, Zap, Check } from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import PageHeader from '../../../components/marketing/common/sections/PageHeader';
import ContentSplit from '../../../components/marketing/common/sections/ContentSplit';
import FeatureGrid from '../../../components/marketing/common/sections/FeatureGrid';
import FAQSection from '../../../components/marketing/common/sections/FAQSection';
import CTA from '../../../components/marketing/common/sections/CTA';
import Footer from '../../../components/marketing/layout/Footer';

const RestaurantSolution = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Restaurant Feedback Management | Chatters - Prevent Bad Reviews</title>
        <meta
          name="description"
          content="Transform your restaurant's customer experience with Chatters. Get instant feedback, prevent negative reviews, and improve service quality with real-time alerts and analytics."
        />
        <meta
          name="keywords"
          content="restaurant feedback software, prevent negative reviews, customer satisfaction, restaurant management, real-time alerts, dining experience"
        />
        <meta property="og:title" content="Restaurant Feedback Management | Chatters" />
        <meta property="og:description" content="Get instant customer feedback and prevent negative reviews with Chatters restaurant feedback management platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/solutions/restaurants" />
      </Helmet>

      {/* Overlay navbar sits above the hero */}
      <Navbar overlay />

      <PageHeader
        title="Restaurant Feedback Management That Prevents Bad Reviews"
        description="Give your restaurant the power to catch customer concerns before they leave your establishment. Turn potential negative reviews into positive experiences with real-time feedback management."
        backgroundGradient="from-white to-orange-200"
        showSubtitle={true}
        subtitle="Restaurant Solutions"
      />

      <ContentSplit
        eyebrow="Built for Restaurants"
        eyebrowColour = "text-orange-600/80"
        title="Catch dining issues before they become bad reviews."
        description="From cold food to slow service, Chatters helps your restaurant team address problems while customers are still at the table. Turn complaints into compliments."
        bullets={[
          "Table-side feedback collection",
          "Kitchen & server alerts", 
          "Peak hour management",
          "Multi-location oversight"
        ]}
        primaryCta={{ label: "Start free trial", to: "/signup" }}
        secondaryCta={{ label: "Explore pricing", to: "/pricing" }}
        image={{ src: "/img/mock-dashboard.png", alt: "Restaurant operations dashboard" }}
      />

      <FeatureGrid
        eyebrow="Restaurant Benefits"
        eyebrowColour = "text-orange-600/80"
        title="Why restaurant teams choose Chatters"
        description="From servers to managers, Chatters fits into your restaurant workflow and helps you fix issues before customers leave unhappy."
        gradientDirection="bg-gradient-to-b"
        backgroundGradient="from-white to-orange-50"
        dottedBackground = {true}
        cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
        items={[
          {
            icon: <Bell className="w-6 h-6 text-orange-600" />,
            title: "Real-time kitchen alerts",
            description:
              "Kitchen staff get instant notifications about food quality issues while dishes can still be remade.",
          },
          {
            icon: <CheckCircle className="w-6 h-6 text-orange-600" />,
            title: "Server-friendly interface",
            description:
              "Servers handle customer concerns through simple prompts during busy service.",
          },
          {
            icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
            title: "Peak hour insights",
            description:
              "Track issues during rush periods and optimise staffing and processes.",
          },
          {
            icon: <Shield className="w-6 h-6 text-orange-600" />,
            title: "Prevent review damage",
            description:
              "Address dining complaints before customers post on Yelp or Google.",
          },
          {
            icon: <Zap className="w-6 h-6 text-orange-600" />,
            title: "Multi-restaurant ready",
            description:
              "Manage feedback across multiple locations with centralized reporting.",
          },
          {
            icon: <Check className="w-6 h-6 text-orange-600" />,
            title: "Increase repeat visits",
            description:
              "Turn negative experiences into positive ones, building customer loyalty.",
          },
        ]}
        wavyBottom={true}
      />

      <FAQSection
        eyebrow="Restaurant FAQ"
        eyebrowColour = "text-orange-600/80"
        title="Everything you need to know"
        description="If you have a different question, contact us and we'll help."
        dottedBackground
        orbGlow
        wavyBottom = {false}
        backgroundGradient="from-white via-white to-orange-50"
        gradientDirection="bg-gradient-to-b"
        defaultOpenIndex={0}
        faqs={[
          { q: "How do customers leave feedback?", a: "QR codes at tables link to simple forms. Customers scan, rate, and comment in under 30 seconds." },
          { q: "Does it work during busy service?", a: "Yes—alerts are designed for fast-paced restaurant environments with quick resolution flows." },
          { q: "Can we use it across multiple restaurants?", a: "Absolutely. Multi-location management with location-specific insights and comparisons built-in." },
          { q: "What if we get too many alerts?", a: "Smart filtering ensures only actionable issues reach staff, with automatic escalation for serious problems." },
        ]}
      />

      <CTA 
        title="Transform your restaurant's customer experience" 
        subtitle="Start your free 14-day trial today and prevent bad reviews before they happen."
        buttonText="Book a Demo"
        buttonLink="/demo"
        gradientDirection="bg-gradient-to-r"
        backgroundGradient="from-orange-50 via-white to-red-50"
      />


      <Footer />
    </div>
  );
};

export default RestaurantSolution;
