// pages/marketing/solutions/RetailSolution.jsx
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

const RetailSolution = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Retail Feedback Management | Chatters - Improve Customer Service</title>
        <meta
          name="description"
          content="Transform your retail customer experience with Chatters. Get instant feedback, prevent negative reviews, and improve service quality with real-time alerts and analytics."
        />
        <meta
          name="keywords"
          content="retail feedback software, prevent negative reviews, customer satisfaction, retail management, real-time alerts, customer service"
        />
        <meta property="og:title" content="Retail Feedback Management | Chatters" />
        <meta property="og:description" content="Get instant customer feedback and prevent negative reviews with Chatters retail feedback management platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/solutions/retail" />
      </Helmet>

      {/* Overlay navbar sits above the hero */}
      <Navbar overlay />

      <PageHeader
        title="Retail Customer Experience Management That Prevents Bad Reviews"
        description="Give your retail business the power to address customer concerns in real-time. Transform shopping frustrations into exceptional service moments that drive loyalty."
        backgroundGradient="from-white to-purple-200"
        showSubtitle={true}
        subtitle="Retail Solutions"
      />

      <ContentSplit
        eyebrow="Built for Retail"
        eyebrowColour = "text-purple-600/80"
        title="Fix customer issues while they're still in your store."
        description="From product availability to checkout problems, Chatters helps your retail team resolve issues immediately. Turn frustrated shoppers into loyal customers."
        bullets={[
          "In-store feedback kiosks",
          "Sales associate alerts", 
          "Manager escalation system",
          "Multi-store analytics"
        ]}
        primaryCta={{ label: "Start free trial", to: "/signup" }}
        secondaryCta={{ label: "Explore pricing", to: "/pricing" }}
        image={{ src: "/img/mock-dashboard.png", alt: "Retail operations dashboard" }}
      />

      <FeatureGrid
        eyebrow="Retail Benefits"
        eyebrowColour = "text-purple-600/80"
        title="Why retail teams choose Chatters"
        description="From sales associates to store managers, Chatters fits into your retail workflow and helps you create exceptional shopping experiences."
        gradientDirection="bg-gradient-to-b"
        backgroundGradient="from-white to-purple-50"
        dottedBackground = {true}
        orbGlow
        cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
        items={[
          {
            icon: <Bell className="w-6 h-6 text-purple-600" />,
            title: "Real-time floor alerts",
            description:
              "Sales associates get instant notifications about customer concerns while they're still shopping.",
          },
          {
            icon: <CheckCircle className="w-6 h-6 text-purple-600" />,
            title: "Mobile-friendly interface",
            description:
              "Staff handle customer feedback through simple mobile prompts during busy shopping periods.",
          },
          {
            icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
            title: "Store performance insights",
            description:
              "Track issues across departments and identify training opportunities for staff.",
          },
          {
            icon: <Shield className="w-6 h-6 text-purple-600" />,
            title: "Protect brand reputation",
            description:
              "Address shopping complaints before customers post on Google or social media.",
          },
          {
            icon: <Zap className="w-6 h-6 text-purple-600" />,
            title: "Multi-location ready",
            description:
              "Manage customer feedback across multiple stores with centralized reporting.",
          },
          {
            icon: <Check className="w-6 h-6 text-purple-600" />,
            title: "Drive repeat purchases",
            description:
              "Turn negative shopping experiences into positive ones, building customer loyalty.",
          },
        ]}
        wavyBottom={true}
      />

      <FAQSection
        eyebrow="Retail FAQ"
        eyebrowColour = "text-purple-600/80"
        title="Everything you need to know"
        description="If you have a different question, contact us and we'll help."
        dottedBackground
        orbGlow
        wavyBottom = {false}
        backgroundGradient="from-white via-white to-purple-50"
        gradientDirection="bg-gradient-to-b"
        defaultOpenIndex={0}
        faqs={[
          { q: "How do customers provide feedback in-store?", a: "QR codes at checkout, customer service desks, or tablet kiosks make it easy for customers to share feedback quickly." },
          { q: "Does it work during busy shopping periods?", a: "Yes, alerts are designed for fast-paced retail environments with quick resolution workflows." },
          { q: "Can we use it across multiple store locations?", a: "Absolutely. Multi-store dashboards with location-specific insights and performance comparisons." },
          { q: "What types of issues does it handle?", a: "Everything from product availability to staff service, checkout problems, and store cleanliness concerns." },
        ]}
      />

      <CTA 
        title="Transform your retail customer experience" 
        subtitle="Start your free 14-day trial and turn shopping frustrations into customer loyalty."
        buttonText="Book a Demo"
        buttonLink="/demo"
        gradientDirection="bg-gradient-to-r"
        backgroundGradient="from-purple-50 via-white to-pink-50"
      />

      <Footer />
    </div>
  );
};

export default RetailSolution;