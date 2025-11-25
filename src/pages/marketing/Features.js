import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Check, Zap, Users, Globe, Lock, MessageSquare, BarChart2, Mail, Settings, Shield } from 'lucide-react';
import Navbar from '../../components/marketing/layout/Navbar';
import FAQSection from '../../components/marketing/common/sections/FAQSection';
import Footer from '../../components/marketing/layout/Footer';

const FeaturesPage = () => {
  const features = [
    {
      title: 'QR Code Restaurant Feedback System',
      description: 'Generate branded QR codes for instant guest feedback collection at tables throughout your UK restaurant, pub, or hotel.',
      icon: Globe,
    },
    {
      title: 'Real-Time Guest Satisfaction Analytics',
      description: 'Track customer satisfaction metrics and identify operational trends as they happen across multiple restaurant locations.',
      icon: BarChart2,
    },
    {
      title: 'Intelligent Sentiment Analysis for Restaurant Reviews',
      description: 'Smart guest sentiment tracking and recommendations to prevent negative TripAdvisor and Google reviews.',
      icon: Zap,
    },
    {
      title: 'Branded QR Code Feedback Forms',
      description: 'Create customised guest surveys with your restaurant branding that capture actionable feedback in under 30 seconds.',
      icon: MessageSquare,
    },
    {
      title: 'Multi-Location Restaurant Management',
      description: 'Coordinate guest feedback responses across your entire restaurant group with role-based access for area managers.',
      icon: Users,
    },
    {
      title: 'Enterprise Security',
      description: 'Built on Supabase infrastructure with SOC 2 Type II compliance and bank-grade security.',
      icon: Lock,
    },
    {
      title: 'Email Notifications',
      description: 'Get notified instantly when new feedback is submitted.',
      icon: Mail,
    },
    {
      title: 'Customisable Dashboards',
      description: 'Tailor your analytics dashboard to focus on the metrics that matter most.',
      icon: Settings,
    },
    {
      title: 'Data Encryption',
      description: 'All data is encrypted in transit and at rest for maximum security.',
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <Helmet>
        <title>Restaurant Management Software Features | Real-Time Guest Feedback | Chatters</title>
        <meta 
          name="description" 
          content="Discover Chatters' powerful restaurant feedback features: instant staff alerts, multi-location analytics, guest sentiment tracking & review prevention tools. Perfect for UK pubs, restaurants & hotel groups."
        />
        <meta 
          name="keywords" 
          content="restaurant management software features, hospitality feedback tools, pub customer experience platform, guest feedback analytics, real-time restaurant alerts, multi-location feedback management, QR code restaurant software"
        />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://getchatters.com/features" />
        <meta property="og:title" content="Restaurant Management Software Features | Chatters" />
        <meta property="og:description" content="Powerful restaurant feedback features: instant staff alerts, multi-location analytics, guest sentiment tracking & review prevention tools for UK hospitality." />
        <meta property="og:site_name" content="Chatters" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://getchatters.com/features" />
        <meta property="twitter:title" content="Restaurant Management Software Features | Chatters" />
        <meta property="twitter:description" content="Powerful restaurant feedback features: instant staff alerts, multi-location analytics & review prevention tools." />
        
        <link rel="canonical" href="https://getchatters.com/features" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        {/* Software Application Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Chatters Restaurant Feedback Software",
            "description": "Real-time guest feedback management platform for UK restaurants, pubs and hotels. Prevent negative reviews with instant staff alerts and QR code feedback collection.",
            "applicationCategory": "BusinessApplication",
            "applicationSubCategory": "Restaurant Management Software",
            "operatingSystem": "Web Browser, iOS, Android",
            "url": "https://getchatters.com/features",
            "offers": {
              "@type": "Offer",
              "price": "149.00", 
              "priceCurrency": "GBP",
              "billingIncrement": "Month",
              "availability": "https://schema.org/InStock"
            },
            "featureList": [
              "Real-time guest feedback alerts",
              "QR code feedback collection", 
              "Multi-location restaurant management",
              "Staff notification system",
              "Intelligent guest sentiment analytics",
              "Review prevention tools",
              "TripAdvisor & Google review routing",
              "Branded feedback forms",
              "Performance analytics dashboard",
              "UK POS system integrations"
            ],
            "targetSector": [
              "Restaurant",
              "Pub", 
              "Hotel",
              "Hospitality"
            ],
            "audience": {
              "@type": "BusinessAudience",
              "audienceType": [
                "Restaurant managers",
                "Pub owners", 
                "Hotel operators",
                "Hospitality groups"
              ]
            }
          })}
        </script>
      </Helmet>

        <Navbar />

      {/* Features Section */}
      <div className="relative pt-32 pb-16 sm:pt-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 space-y-3 tracking-tight">
              <span className="block">Advanced Restaurant Feedback</span>
              <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Management Features
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
              Powerful UK hospitality technology designed to help restaurants, pubs, and hotels collect, analyse, and act on guest feedback to prevent negative reviews.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
                    <feature.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="mt-4 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">UK Restaurant Teams Love Chatters</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from UK hospitality businesses that have transformed their guest feedback process with Chatters. Learn more <a href="/about" className="text-blue-600 hover:text-blue-700 underline">about our company</a> and <a href="/pricing" className="text-blue-600 hover:text-blue-700 underline">pricing options</a>.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'Jess',
                role: 'Operations Director - UK Pub Group',
                testimonial:
                  'Chatters has completely changed how we handle guest feedback across our venues. The real-time alerts prevent negative TripAdvisor reviews.',
              },
              {
                name: 'Steve',
                role: 'Restaurant Owner - Yorkshire',
                testimonial:
                  'The sentiment analysis and QR code system helped us improve our Google ratings from 3.2 to 4.7 stars in six months.',
              },
              {
                name: 'Sarah',
                role: 'Hotel Manager - London',
                testimonial:
                  'The multi-location dashboard lets us compare guest satisfaction across all our properties. Essential for any UK hospitality group.',
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <p className="text-gray-600 italic">"{testimonial.testimonial}"</p>
                <div className="mt-4 flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <FAQSection
        eyebrow="Features FAQ"
        eyebrowColour='text-green-600/80'
        title="Restaurant Management Software Questions"
        description="Learn more about Chatters' features for UK hospitality businesses. Need more help? <a href='/contact' class='text-blue-600 hover:text-blue-700 underline'>Contact our team</a>."
        dottedBackground
        wavyBottom={false}
        backgroundGradient="from-white via-white to-green-50"
        gradientDirection="bg-gradient-to-b"
        defaultOpenIndex={0}
        faqs={[
          { 
            q: "What restaurant management features help improve guest satisfaction?", 
            a: "Chatters includes intelligent sentiment analysis, table-specific feedback tracking, staff performance metrics, and automated review routing to Google and TripAdvisor for satisfied guests. Our QR code system captures feedback instantly while guests are still in your venue." 
          },
          { 
            q: "Do you offer analytics for restaurant group operations?", 
            a: "Yes, our multi-location dashboard provides comparative analytics across venues, identifying top-performing locations, staff recognition opportunities, and operational trends to optimise your entire UK restaurant group." 
          },
          { 
            q: "How does the QR code feedback system work in busy restaurants?", 
            a: "Our QR codes are designed for high-volume environments. Guests scan, provide feedback in under 30 seconds, and staff receive instant alerts. The system handles hundreds of concurrent users without slowdown." 
          },
          { 
            q: "Can we customise feedback forms for different venue types?", 
            a: "Absolutely. Whether you run pubs, fine dining restaurants, or hotels, you can create branded feedback forms tailored to your specific operations, with custom questions that matter to your business type." 
          },
          { 
            q: "What integrations work with UK restaurant POS systems?", 
            a: "Chatters integrates with major UK POS systems including Epos Now, TouchBistro, Square, and Toast. We can sync guest data, table numbers, and receipt information for comprehensive feedback tracking." 
          }
        ]}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FeaturesPage;