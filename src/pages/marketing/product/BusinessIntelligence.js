import React from 'react';
import { Helmet } from 'react-helmet';
import { BarChart3, TrendingUp, PieChart, LineChart, Target, Database } from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import PageHeader from '../../../components/marketing/common/sections/PageHeader';
import ContentSplit from '../../../components/marketing/common/sections/ContentSplit';
import ProductFeaturesShowcase from '../../../components/marketing/common/sections/ProductFeaturesShowcase';
import FeatureGrid from '../../../components/marketing/common/sections/FeatureGrid';
import FAQSection from '../../../components/marketing/common/sections/FAQSection';
import CTA from '../../../components/marketing/common/sections/CTA';
import Footer from '../../../components/marketing/layout/Footer';

const BusinessIntelligenceProduct = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Business Intelligence | Chatters - Turn Feedback into Insights</title>
        <meta
          name="description"
          content="Transform customer feedback into actionable business insights. Chatters' BI tools help you identify trends, measure satisfaction, and make data-driven decisions."
        />
        <meta
          name="keywords"
          content="business intelligence, feedback analytics, customer insights, satisfaction metrics, feedback reporting, data visualization"
        />
        <meta property="og:title" content="Business Intelligence | Chatters" />
        <meta property="og:description" content="Turn customer feedback into powerful business insights with Chatters' comprehensive BI and analytics platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/business-intelligence" />
      </Helmet>

      {/* Overlay navbar sits above the hero */}
      <Navbar overlay />

      <PageHeader
        title="Business Intelligence That Turns Feedback Into Strategic Insights"
        description="See beyond individual complaints to understand customer satisfaction trends, operational patterns, and growth opportunities. Make data-driven decisions with confidence."
        backgroundGradient="from-white to-blue-200"
        showSubtitle={true}
        subtitle="Business Intelligence"
      />

      <ContentSplit reversed
        eyebrow="Advanced Analytics"
        eyebrowColour='text-blue-600'
        title="Transform feedback into business intelligence."
        description="Our powerful analytics engine turns customer feedback into actionable insights, helping you identify trends, measure performance, and make strategic decisions backed by real data."
        bullets={[
          "Real-time satisfaction metrics",
          "Trend analysis & forecasting",
          "Custom reporting dashboards",
          "Competitive benchmarking"
        ]}
        primaryCta={{ label: "Explore analytics", to: "/signup" }}
        secondaryCta={{ label: "See dashboard", to: "/demo" }}
        image={{ src: "/img/product_pages/businessintelligence/hero_img.png", alt: "Business intelligence dashboard" }}
      />

      <ProductFeaturesShowcase
        eyebrow="Intelligence Platform"
        eyebrowColour='text-blue-600'
        title="See the big picture with powerful analytics."
        description="Our BI platform transforms raw feedback data into strategic insights, helping you understand customer satisfaction patterns and make informed business decisions."
        primaryCta={{ label: "Try analytics free", to: "/signup" }}
        secondaryCta={{ label: "View demo", to: "/demo" }}
        features={[
          {
            id: "dashboards",
            eyebrow: "Real-time",
            title: "Live satisfaction dashboards",
            description: "Monitor customer satisfaction metrics in real-time with customisable dashboards that show what matters most to your business.",
            bullets: ["Live satisfaction scores", "Custom KPIs", "Alert thresholds"],
            image: { src: "/img/mock-dashboards.png", alt: "BI dashboard interface" },
          },
          {
            id: "trends",
            eyebrow: "Predictive",
            title: "Trend analysis & forecasting",
            description: "Identify satisfaction trends before they become problems. Our AI highlights patterns and predicts future performance.",
            bullets: ["Trend detection", "Predictive analytics", "Early warning alerts"],
            image: { src: "/img/mock-trends.png", alt: "Trend analysis charts" },
          },
          {
            id: "reporting",
            eyebrow: "Executive",
            title: "Automated reporting suite",
            description: "Generate comprehensive reports automatically. From daily summaries to executive briefings, get the insights you need when you need them.",
            bullets: ["Scheduled reports", "Custom branding", "Multi-format export"],
            image: { src: "/img/mock-reports.png", alt: "Automated reporting" },
          },
        ]}
      />


      <FeatureGrid
        eyebrow="Intelligence Benefits"
        eyebrowColour='text-blue-600'
        title="Why leaders choose our BI platform"
        description="Transform raw feedback into strategic insights that drive better decisions, improved operations, and measurable business growth."
        gradientDirection="bg-gradient-to-b"
        backgroundGradient="from-white to-blue-50"
        dottedBackground={true}
        orbGlow
        cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
        items={[
          {
            icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
            title: "Real-time metrics",
            description:
              "Monitor satisfaction scores, response times, and resolution rates as they happen across all locations.",
          },
          {
            icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
            title: "Trend identification",
            description:
              "Spot satisfaction trends early with AI-powered analysis that highlights patterns before they become problems.",
          },
          {
            icon: <PieChart className="w-6 h-6 text-blue-600" />,
            title: "Custom dashboards",
            description:
              "Build personalised dashboards that focus on your key metrics and business objectives.",
          },
          {
            icon: <LineChart className="w-6 h-6 text-blue-600" />,
            title: "Predictive analytics",
            description:
              "Forecast future performance and identify potential issues before they impact customer satisfaction.",
          },
          {
            icon: <Target className="w-6 h-6 text-blue-600" />,
            title: "Goal tracking",
            description:
              "Set satisfaction targets and track progress with automated alerts when you're off track.",
          },
          {
            icon: <Database className="w-6 h-6 text-blue-600" />,
            title: "Data integration",
            description:
              "Connect feedback data with your existing business systems for comprehensive insights.",
          },
        ]}
        wavyBottom={true}
      />

      <FAQSection
        eyebrow="BI FAQ"
        eyebrowColour='text-blue-600'
        title="Everything you need to know"
        description="If you have a different question, contact us and we'll help."
        dottedBackground
        orbGlow
        wavyBottom={false}
        backgroundGradient="from-white via-white to-blue-50"
        gradientDirection="bg-gradient-to-b"
        defaultOpenIndex={0}
        faqs={[
          { q: "How quickly are analytics updated?", a: "All metrics and dashboards update in real-time as feedback is received, giving you immediate insights into customer satisfaction." },
          { q: "Can I create custom reports?", a: "Yes - build custom reports with your specific metrics, filters, and branding. Schedule automatic delivery to stakeholders." },
          { q: "Does it integrate with other business tools?", a: "We integrate with popular business intelligence tools, CRMs, and data warehouses to complement your existing analytics stack." },
          { q: "What kind of predictive insights do you provide?", a: "Our AI identifies satisfaction trends, predicts potential issues, and recommends actions based on historical patterns and industry benchmarks." },
        ]}
      />

      <CTA 
        title="Turn feedback into competitive advantage" 
        subtitle="Start your free trial and discover insights that drive better business decisions and customer satisfaction."
        buttonText="Book a Demo"
        buttonLink="/demo"
        gradientDirection="bg-gradient-to-r"
        backgroundGradient="from-blue-50 via-white to-indigo-50"
      />


      <Footer />
    </div>
  );
};

export default BusinessIntelligenceProduct;
