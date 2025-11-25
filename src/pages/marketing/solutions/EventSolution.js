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

const EventSolution = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Event Feedback Management | Chatters - Perfect Event Experiences</title>
        <meta
          name="description"
          content="Transform your event experiences with Chatters. Get instant feedback, prevent negative reviews, and improve event quality with real-time alerts and analytics."
        />
        <meta
          name="keywords"
          content="event feedback software, prevent negative reviews, attendee satisfaction, event management, real-time alerts, event experience"
        />
        <meta property="og:title" content="Event Feedback Management | Chatters" />
        <meta property="og:description" content="Get instant attendee feedback and prevent negative reviews with Chatters event feedback management platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/solutions/events" />
      </Helmet>

      {/* Overlay navbar sits above the hero */}
      <Navbar overlay />

      <PageHeader
        title="Event Experience Management That Creates Perfect Events"
        description="Give your event team the power to address attendee concerns in real-time. Transform event issues into exceptional moments that attendees will remember."
        backgroundGradient="from-white to-green-200"
        showSubtitle={true}
        subtitle="Event Solutions"
      />

      <ContentSplit
        eyebrow="Built for Events"
        eyebrowColour = "text-green-600/80"
        title="Fix event issues while they're still happening."
        description="From AV problems to catering concerns, Chatters helps your event team resolve issues instantly. Turn event hiccups into seamless experiences."
        bullets={[
          "Live event feedback collection",
          "Event staff instant alerts", 
          "Real-time issue resolution",
          "Multi-event analytics"
        ]}
        primaryCta={{ label: "Start free trial", to: "/signup" }}
        secondaryCta={{ label: "Explore pricing", to: "/pricing" }}
        image={{ src: "/img/mock-dashboard.png", alt: "Event operations dashboard" }}
      />

      <FeatureGrid
        eyebrow="Event Benefits"
        eyebrowColour = "text-green-600/80"
        title="Why event teams choose Chatters"
        description="From event coordinators to venue staff, Chatters fits into your event workflow and helps you create unforgettable experiences."
        gradientDirection="bg-gradient-to-b"
        backgroundGradient="from-white to-green-50"
        dottedBackground = {true}
        orbGlow
        cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
        items={[
          {
            icon: <Bell className="w-6 h-6 text-green-600" />,
            title: "Live event alerts",
            description:
              "Event staff get instant notifications about issues while the event is still in progress.",
          },
          {
            icon: <CheckCircle className="w-6 h-6 text-green-600" />,
            title: "Attendee-friendly feedback",
            description:
              "Simple QR codes allow attendees to report issues without disrupting the event experience.",
          },
          {
            icon: <BarChart3 className="w-6 h-6 text-green-600" />,
            title: "Event performance tracking",
            description:
              "Monitor satisfaction across different event segments and improve future events.",
          },
          {
            icon: <Shield className="w-6 h-6 text-green-600" />,
            title: "Reputation protection",
            description:
              "Address event issues before attendees post on social media or review platforms.",
          },
          {
            icon: <Zap className="w-6 h-6 text-green-600" />,
            title: "Multi-event ready",
            description:
              "Manage feedback across multiple events with centralized reporting and insights.",
          },
          {
            icon: <Check className="w-6 h-6 text-green-600" />,
            title: "Build attendee loyalty",
            description:
              "Turn event problems into service recovery moments that create lasting impressions.",
          },
        ]}
        wavyBottom={true}
      />

      <FAQSection
        eyebrow="Event FAQ"
        eyebrowColour = "text-green-600/80"
        title="Everything you need to know"
        description="If you have a different question, contact us and we'll help."
        dottedBackground
        orbGlow
        wavyBottom = {false}
        backgroundGradient="from-white via-white to-green-50"
        gradientDirection="bg-gradient-to-b"
        defaultOpenIndex={0}
        faqs={[
          { q: "How do attendees provide feedback during events?", a: "QR codes on event materials or displays allow attendees to quickly share feedback without interrupting presentations." },
          { q: "Can it handle different types of events?", a: "Yes—conferences, weddings, corporate events, festivals, and more. Customisable workflows for any event type." },
          { q: "Does it work for multi-day events?", a: "Absolutely. Track feedback trends across days and sessions with detailed event analytics." },
          { q: "What if we manage multiple events?", a: "Multi-event dashboards let you compare performance and apply learnings across your event portfolio." },
        ]}
      />

      <CTA 
        title="Create unforgettable event experiences" 
        subtitle="Start your free 14-day trial and turn event challenges into seamless experiences."
        buttonText="Book a Demo"
        buttonLink="/demo"
        gradientDirection="bg-gradient-to-r"
        backgroundGradient="from-green-50 via-white to-teal-50"
      />

      <Footer />
    </div>
  );
};

export default EventSolution;