import React from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '../../components/marketing/layout/Navbar';
import Footer from '../../components/marketing/layout/Footer';
import Hero from '../../components/home/Hero';
import Problem from '../../components/home/Problem';
import HowItWorks from '../../components/home/HowItWorks';
import Features from '../../components/home/Features';
import Testimonials from '../../components/home/Testimonials';
import Industries from '../../components/home/Industries';
import Differentiator from '../../components/home/Differentiator';
import Pricing from '../../components/home/Pricing';
import FAQ from '../../components/home/FAQ';
import FinalCTA from '../../components/home/FinalCTA';

const LandingPage = () => {

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Chatters Restaurant Feedback Software",
    "description": "Real-time guest feedback management platform for UK restaurants, pubs and hotels. Prevent negative reviews with instant staff alerts and QR code feedback collection.",
    "url": "https://getchatters.com",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Restaurant Management Software",
    "operatingSystem": "Web Browser, iOS, Android",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": "149.00",
      "billingIncrement": "Month",
      "priceValidUntil": "2025-12-31",
      "availability": "https://schema.org/InStock"
    },
    "featureList": [
      "Real-time guest feedback alerts",
      "QR code feedback collection", 
      "Multi-location restaurant management",
      "Staff notification system",
      "Intelligent guest sentiment analytics",
      "Review prevention tools",
      "TripAdvisor & Google review routing"
    ],
    "targetSector": [
      "Restaurant",
      "Pub",
      "Hotel",
      "Hospitality"
    ],
    "publisher": {
      "@type": "Organization",
      "name": "Chatters",
      "alternateName": "Chatters Ltd",
      "url": "https://getchatters.com",
      "foundingDate": "2023",
      "serviceArea": {
        "@type": "Country",
        "name": "United Kingdom"
      },
      "knowsAbout": [
        "Restaurant feedback software",
        "Hospitality technology",
        "Guest experience management", 
        "Review prevention software",
        "QR code feedback systems"
      ]
    }
  };

  return (
    <div className="min-h-screen bg-white pt-16">
      <Helmet>
        <title>Restaurant Feedback Software UK | Prevent Bad Reviews | Chatters</title>
        <meta 
          name="description" 
          content="Stop negative reviews before they happen. Chatters provides real-time customer feedback alerts for restaurants, pubs & hotels across the UK. Boost ratings instantly with QR code feedback collection. Free 14-day trial."
        />
        <meta 
          name="keywords" 
          content="restaurant feedback software UK, pub customer feedback system, hospitality feedback management, prevent negative reviews, real-time guest feedback, QR code feedback system, restaurant management software, pub technology UK, hotel feedback platform, customer satisfaction software"
        />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://getchatters.com/" />
        <meta property="og:title" content="Restaurant Feedback Software UK | Prevent Bad Reviews | Chatters" />
        <meta property="og:description" content="Stop negative reviews before they happen. Chatters provides real-time customer feedback alerts for restaurants, pubs & hotels across the UK. Free 14-day trial." />
        <meta property="og:image" content="https://getchatters.com/img/chatters-og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Chatters" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://getchatters.com/" />
        <meta property="twitter:title" content="Restaurant Feedback Software UK | Prevent Bad Reviews | Chatters" />
        <meta property="twitter:description" content="Stop negative reviews before they happen. Real-time customer feedback alerts for UK restaurants, pubs & hotels. Free 14-day trial." />
        <meta property="twitter:image" content="https://getchatters.com/img/chatters-twitter-image.jpg" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google-site-verification" content="your-google-site-verification-code" />
        <meta name="author" content="Chatters Ltd" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1A535C" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://getchatters.com/" />
        
        {/* Alternate Language Versions */}
        <link rel="alternate" hreflang="en" href="https://getchatters.com/" />
        <link rel="alternate" hreflang="en-US" href="https://getchatters.com/" />
        <link rel="alternate" hreflang="en-GB" href="https://getchatters.com/" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        
        {/* Additional Structured Data for FAQ */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does restaurant feedback software prevent negative TripAdvisor reviews?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Chatters captures guest concerns in real-time via QR codes at tables, alerting staff instantly so issues can be resolved before guests leave. This proactive approach prevents most negative reviews from ever being posted online."
                }
              },
              {
                "@type": "Question",
                "name": "What's the best customer feedback system for UK pub chains?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Chatters is designed specifically for UK hospitality groups, offering multi-location management, role-based access for area managers, and real-time analytics across all venues from a single dashboard."
                }
              },
              {
                "@type": "Question",
                "name": "How quickly do staff receive feedback alerts in busy restaurants?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Staff receive push notifications within 10 seconds of guest submission. Alerts are prioritised by severity, ensuring critical issues reach managers immediately whilst routine requests go to floor staff."
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <Navbar />

      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Industries />
      <Differentiator />
      <Pricing />
      <FAQ />
      <FinalCTA />

      <Footer />
    </div>
  );
};

export default LandingPage;