import React from 'react';
import { Helmet } from 'react-helmet';
import { Building, MapPin, Users, BarChart2, Globe, Shield } from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import PageHeader from '../../../components/marketing/common/sections/PageHeader';
import ContentSplit from '../../../components/marketing/common/sections/ContentSplit';
import ProductFeaturesShowcase from '../../../components/marketing/common/sections/ProductFeaturesShowcase';
import FeatureGrid from '../../../components/marketing/common/sections/FeatureGrid';
import FAQSection from '../../../components/marketing/common/sections/FAQSection';
import CTA from '../../../components/marketing/common/sections/CTA';
import Footer from '../../../components/marketing/layout/Footer';

const MultiLocationControlProduct = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Multi-Location Control | Chatters - Manage Feedback Across All Locations</title>
        <meta
          name="description"
          content="Manage customer feedback across all your locations from one dashboard. Compare performance, standardize processes, and maintain quality at scale with Chatters."
        />
        <meta
          name="keywords"
          content="multi-location management, chain management, franchise feedback, location comparison, centralized control, multi-site feedback"
        />
        <meta property="og:title" content="Multi-Location Control | Chatters" />
        <meta property="og:description" content="Manage customer feedback across all locations with centralized control and location-specific insights." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/multi-location-control" />
      </Helmet>

      {/* Overlay navbar sits above the hero */}
      <Navbar overlay />

      <PageHeader
        title="Multi-Location Control That Scales With Your Business"
        description="Manage customer satisfaction across all your locations from one central dashboard. Compare performance, identify trends, and maintain consistent quality at every site."
        backgroundGradient="from-white to-green-200"
        showSubtitle={true}
        subtitle="Multi-Location Control"
      />

      <ContentSplit reversed
        eyebrow="Enterprise Scale"
        eyebrowColour='text-blue-600'
        title="One dashboard for all your locations."
        description="Whether you have 2 locations or 200, manage customer feedback across your entire network from a single, powerful dashboard that scales with your business."
        bullets={[
          "Centralized location management",
          "Cross-location comparisons", 
          "Standardized processes",
          "Regional performance tracking"
        ]}
        primaryCta={{ label: "Try multi-location", to: "/signup" }}
        secondaryCta={{ label: "See demo", to: "/demo" }}
        image={{ src: "/img/product_pages/multilocationcontrol/hero.png", alt: "Multi-location dashboard" }}
      />

      <ProductFeaturesShowcase
        eyebrow="Scale Intelligence"
        eyebrowColour='text-blue-600'
        title="Manage your entire network like a single location."
        description="Our multi-location platform gives you the tools to maintain consistent quality, compare performance, and identify opportunities across your entire business network."
        primaryCta={{ label: "Scale your feedback", to: "/signup" }}
        secondaryCta={{ label: "View features", to: "/demo" }}
        features={[
          {
            id: "dashboard",
            eyebrow: "Unified View",
            title: "Centralized location dashboard",
            description: "See all your locations at a glance with real-time satisfaction scores, alerts, and performance metrics in one comprehensive dashboard.",
            bullets: ["Live location status", "Performance rankings", "Alert summaries"],
            image: { src: "/img/mock-central.png", alt: "Central dashboard" },
          },
          {
            id: "compare",
            eyebrow: "Benchmarking",
            title: "Location performance comparison",
            description: "Compare satisfaction scores, response times, and resolution rates across locations to identify top performers and areas for improvement.",
            bullets: ["Side-by-side comparison", "Performance rankings", "Trend analysis"],
            image: { src: "/img/mock-compare.png", alt: "Location comparison" },
          },
          {
            id: "standards",
            eyebrow: "Consistency",
            title: "Standardized processes",
            description: "Roll out consistent feedback processes, question sets, and workflows across all locations while allowing for local customization.",
            bullets: ["Template deployment", "Brand consistency", "Local flexibility"],
            image: { src: "/img/mock-standards.png", alt: "Process standardization" },
          },
        ]}
      />


      <FeatureGrid
        eyebrow="Multi-Location Benefits"
        eyebrowColour='text-blue-600'
        title="Why multi-location businesses choose Chatters"
        description="Scale your customer experience management across locations while maintaining the personal touch that makes each site unique."
        gradientDirection="bg-gradient-to-b"
        backgroundGradient="from-white to-blue-50"
        dottedBackground={true}
        orbGlow
        cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
        items={[
          {
            icon: <Building className="w-6 h-6 text-blue-600" />,
            title: "Centralized control",
            description:
              "Manage all locations from one dashboard while giving local teams the tools they need to succeed.",
          },
          {
            icon: <MapPin className="w-6 h-6 text-blue-600" />,
            title: "Location-specific insights",
            description:
              "Drill down into individual location performance with detailed analytics and trend tracking.",
          },
          {
            icon: <Users className="w-6 h-6 text-blue-600" />,
            title: "Role-based permissions",
            description:
              "Give regional managers, area directors, and local staff appropriate access levels and capabilities.",
          },
          {
            icon: <BarChart2 className="w-6 h-6 text-blue-600" />,
            title: "Performance benchmarking",
            description:
              "Compare satisfaction scores across locations to identify best practices and improvement opportunities.",
          },
          {
            icon: <Globe className="w-6 h-6 text-blue-600" />,
            title: "Scalable infrastructure",
            description:
              "Our platform grows with your business - add new locations easily without complexity.",
          },
          {
            icon: <Shield className="w-6 h-6 text-blue-600" />,
            title: "Brand consistency",
            description:
              "Ensure consistent customer experience standards across all locations while allowing local flexibility.",
          },
        ]}
        wavyBottom={true}
      />

      <FAQSection
        eyebrow="Multi-Location FAQ"
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
          { q: "How many locations can I manage?", a: "There's no limit - our platform scales from 2 locations to thousands. Pricing is per location with volume discounts available." },
          { q: "Can different locations have different settings?", a: "Yes - set global defaults then customise questions, workflows, and alerts for individual locations or regions as needed." },
          { q: "How do permissions work across locations?", a: "Set role-based permissions so regional managers see their areas, location managers see their sites, and corporate sees everything." },
          { q: "Can I compare performance between locations?", a: "Absolutely - compare satisfaction scores, response times, and trends across locations with detailed benchmarking reports." },
        ]}
      />

      <CTA 
        title="Scale customer experience across all locations" 
        subtitle="Start your free trial and manage feedback across your entire network from one powerful dashboard."
        buttonText="Book a Demo"
        buttonLink="/demo"
        gradientDirection="bg-gradient-to-r"
        backgroundGradient="from-blue-50 via-white to-teal-50"
      />


      <Footer />
    </div>
  );
};

export default MultiLocationControlProduct;
