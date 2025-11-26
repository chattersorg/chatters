import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Navbar from '../../components/marketing/layout/Navbar';
import Hero from '../../components/marketing/pages/LandingPage/Hero.js';
import AlternatingSections from '../../components/marketing/common/sections/AlternatingSections.js';
import TestimonialsSection from '../../components/marketing/common/sections/Testimonials.js';
import FAQSection from '../../components/marketing/common/sections/FAQSection.js';
import Footer from '../../components/marketing/layout/Footer';
import CTA from '../../components/marketing/common/sections/CTA';

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

      <AlternatingSections
        sections={[
          {
            title: "Real-Time Restaurant Feedback Resolution",
            description: "Monitor guest satisfaction in real-time with instant staff alerts. Chatters helps UK restaurants respond to customer feedback in real-time, preventing negative TripAdvisor reviews before they happen.",
            image: "/img/homepage/AlternatingSections/AverageResolutionTime-Chatters.svg",
            link: "/demo"
          },
          {
            title: "Prevent Negative Restaurant Reviews",
            description: "Capture guest concerns at the table before they become online complaints. Our QR code feedback system helps UK pubs and restaurants maintain 5-star ratings across Google and TripAdvisor.",
            image: "/img/homepage/AlternatingSections/PreventBadFeedback.svg",
            link: "/features"
          },
          {
            title: "Multi-Location Restaurant Management",
            description: "Optimise staffing across your restaurant group with real-time guest feedback analytics. Compare performance between venues and identify operational trends to improve customer satisfaction.",
            image: "/img/homepage/AlternatingSections/OptimiseStaffing.svg",
            link: "/pricing"
          },
        ]}
      />

      <TestimonialsSection
        eyebrow="Testimonials"
        title="UK Restaurant Teams Prevent Bad Reviews with Chatters"
        description={
          <>
            Real feedback from UK pub managers, restaurant operators, and hotel teams using our guest feedback software daily. See our{' '}
            <Link to="/features" className="text-blue-600 hover:text-blue-700 underline">
              complete feature list
            </Link>
            {' '}or{' '}
            <Link to="/pricing" className="text-blue-600 hover:text-blue-700 underline">
              pricing options
            </Link>
            .
          </>
        }
        cols={{ base: 1, sm: 1, md: 2, lg: 3 }}
        dottedBackground
        orbGlow
        wavyBottom
        items={[
          {
            quote: "We catch unhappy guests instantly instead of reading it on TripAdvisor the next day.",
            author: "Laura Hughes",
            role: "GM, The King’s Arms",
            avatar: "/img/avatars/laura.jpg",
            logo: "/img/logos/kingsarms.svg",
            rating: 5,
          },
          {
            quote: "Chatters has become part of our daily ops—our team check it like they check tickets.",
            author: "Marcus Doyle",
            role: "Ops Manager, Brew & Co.",
            avatar: "/img/avatars/marcus.jpg",
            logo: "/img/logos/brewco.svg",
            rating: 4.5,
          },
          {
            quote: "We stopped over 50 potential one-star reviews in the first six weeks.",
            author: "Emma Walsh",
            role: "Owner, The Dockside",
            avatar: "/img/avatars/emma.jpg",
            logo: "/img/logos/dockside.svg",
            rating: 5,
          },
          {
            quote: "Staff love it—alerts pop up and they fix problems on the spot.",
            author: "Ryan Turner",
            role: "Floor Manager, Copperhouse Pub",
            avatar: "/img/avatars/ryan.jpg",
            logo: "/img/logos/copperhouse.svg",
            rating: 4.5,
          },
          {
            quote: "We’ve never had a simpler system roll out—no training, just scan and go.",
            author: "Helen Carter",
            role: "Ops Director, Urban Taverns",
            avatar: "/img/avatars/helen.jpg",
            logo: "/img/logos/urbantaverns.svg",
            rating: 5,
          },
          {
            quote: "Our service scores jumped within a month of using Chatters.",
            author: "James O’Neill",
            role: "Owner, The White Hart",
            avatar: "/img/avatars/james.jpg",
            logo: "/img/logos/whitehart.svg",
            rating: 5,
          },
          {
            quote: "We now know exactly where and when issues happen—down to the table.",
            author: "Priya Desai",
            role: "Area Manager, Sun & Stone",
            avatar: "/img/avatars/priya.jpg",
            logo: "/img/logos/sunstone.svg",
            rating: 4.5,
          },
          {
            quote: "Our guests love being listened to in the moment instead of after the fact.",
            author: "Tom Richards",
            role: "Manager, The Railway Inn",
            avatar: "/img/avatars/tom.jpg",
            logo: "/img/logos/railwayinn.svg",
            rating: 5,
          },
          {
            quote: "Simple, effective, and worth every penny—this is a no-brainer for us.",
            author: "Hannah Green",
            role: "Owner, The Crown & Bell",
            avatar: "/img/avatars/hannah.jpg",
            logo: "/img/logos/crownbell.svg",
            rating: 5,
          },
          {
            quote: "We stopped chasing feedback by email—guests just scan the QR and talk to us directly.",
            author: "George Evans",
            role: "Ops Lead, Bar Nine",
            avatar: "/img/avatars/george.jpg",
            logo: "/img/logos/barnine.svg",
            rating: 4.5,
          },
          {
            quote: "Our TripAdvisor page is now full of five-stars instead of mixed reviews.",
            author: "Sophie Martin",
            role: "Owner, The Old Wharf",
            avatar: "/img/avatars/sophie.jpg",
            logo: "/img/logos/oldwharf.svg",
            rating: 5,
          },
          {
            quote: "Instant alerts mean my staff solve problems before I even get to the floor.",
            author: "Daniel Price",
            role: "GM, Riverside Bar & Kitchen",
            avatar: "/img/avatars/daniel.jpg",
            logo: "/img/logos/riverside.svg",
            rating: 5,
          },
          {
            quote: "We prevented a blow-up situation with a large group thanks to Chatters.",
            author: "Lucy Hall",
            role: "Shift Lead, The Watermill",
            avatar: "/img/avatars/lucy.jpg",
            logo: "/img/logos/watermill.svg",
            rating: 4.5,
          },
          {
            quote: "Finally, something built for hospitality that doesn’t need endless onboarding.",
            author: "Chris Bennett",
            role: "Ops Manager, The Red Lion Group",
            avatar: "/img/avatars/chris.jpg",
            logo: "/img/logos/redlion.svg",
            rating: 5,
          },
          {
            quote: "Our guest satisfaction scores are the highest they’ve ever been.",
            author: "Isabella Romano",
            role: "Owner, Trattoria Romano",
            avatar: "/img/avatars/isabella.jpg",
            logo: "/img/logos/romano.svg",
            rating: 5,
          },

        ]}
      />



      <CTA 
        title="Ready to Prevent Negative Restaurant Reviews?"
        subtitle="Join hundreds of UK restaurants, pubs, and hotels already using Chatters to improve guest satisfaction and protect their online reputation. Start your free 14-day trial today."
        buttonText="Book a Demo"
        buttonLink="/demo"
      />

       <FAQSection
        eyebrow="Chatters FAQ"
        title="Everything you need to know"
        description="If you have a different question, contact us and we'll help."
        dottedBackground
        wavyBottom = {false}
        backgroundGradient="from-white via-white to-orange-50"
        gradientDirection="bg-gradient-to-b"
        defaultOpenIndex={0}
        faqs={[
          { q: "How does restaurant feedback software prevent negative TripAdvisor reviews?", a: "Chatters captures guest concerns in real-time via QR codes at tables, alerting staff instantly so issues can be resolved before guests leave. This proactive approach prevents most negative reviews from ever being posted online." },
          { q: "What's the best customer feedback system for UK pub chains?", a: "Chatters is designed specifically for UK hospitality groups, offering multi-location management, role-based access for area managers, and real-time analytics across all venues from a single dashboard." },
          { q: "How quickly do staff receive feedback alerts in busy restaurants?", a: "Staff receive push notifications within 10 seconds of guest submission. Alerts are prioritised by severity, ensuring critical issues reach managers immediately whilst routine requests go to floor staff." },
          { q: "Does it work during busy service periods?", a: "Yes—alerts are designed for fast-paced restaurant environments with quick resolution flows and smart filtering to prevent alert fatigue." },
          { q: "What if we get too many feedback alerts?", a: "Smart filtering ensures only actionable issues reach staff, with automatic escalation for serious problems and customisable alert thresholds for different venue types." },
        ]}
      />

      <Footer />
    </div>
  );
};

export default LandingPage;