import React from 'react';
import { Helmet } from 'react-helmet';
import {
  BookOpen,
  Zap,
  Smartphone,
  MessageSquare,
  Settings,
  BarChart3,
  Users,
  HelpCircle,
  ArrowRight,
  Play,
  FileText,
  Shield,
  CreditCard
} from 'lucide-react';
import Navbar from '../../components/marketing/layout/Navbar';
import PageHeader from '../../components/marketing/common/sections/PageHeader';
import Footer from '../../components/marketing/layout/Footer';

const HelpNewPage = () => {
  const helpGuides = [
    {
      category: "Getting Started",
      icon: Play,
      color: "blue",
      guides: [
        {
          title: "Quick Start Guide",
          description: "Get up and running with Chatters in under 10 minutes",
          link: "/help/quick-start-guide"
        },
        {
          title: "Setting Up Your First Venue",
          description: "Step-by-step guide to creating and configuring your venue",
          link: "/help/setting-up-first-venue"
        },
        {
          title: "Creating Your QR Code",
          description: "Generate and deploy your first feedback QR code",
          link: "/help/creating-qr-code"
        },
        {
          title: "Testing Your System",
          description: "How to properly test your feedback system before going live",
          link: "/help/testing-system"
        }
      ]
    },
    {
      category: "QR Codes & Setup",
      icon: Smartphone,
      color: "green",
      guides: [
        {
          title: "QR Code Best Practices",
          description: "Learn where and how to place QR codes for maximum engagement",
          link: "/help/qr-code-best-practices"
        },
        {
          title: "Printing Your QR Codes",
          description: "Size recommendations and printing guidelines",
          link: "/help/printing-qr-codes"
        },
        {
          title: "QR Code Not Scanning?",
          description: "Troubleshoot common QR code scanning issues",
          link: "/help/qr-code-troubleshooting"
        },
        {
          title: "Multiple QR Codes for One Venue",
          description: "Set up different QR codes for different areas",
          link: "/help/multiple-qr-codes"
        }
      ]
    },
    {
      category: "Kiosk Mode",
      icon: MessageSquare,
      color: "purple",
      guides: [
        {
          title: "Understanding Kiosk Mode",
          description: "Your real-time dashboard for customer feedback and alerts",
          link: "/help/understanding-kiosk-mode"
        },
        {
          title: "Setting Up Your Floor Plan",
          description: "Configure tables and areas for visual feedback display",
          link: "/help/setting-up-floor-plan"
        },
        {
          title: "Alert Colours Explained",
          description: "Learn the colour-coded priority system for feedback",
          link: "/help/alert-colours-explained"
        },
        {
          title: "Staff Training for Kiosk Mode",
          description: "Best practices for training your team on the kiosk",
          link: "/help/staff-training-kiosk"
        }
      ]
    },
    {
      category: "Assistance Requests",
      icon: Zap,
      color: "orange",
      guides: [
        {
          title: "What Are Assistance Requests?",
          description: "Quick help requests from customers without formal feedback",
          link: "/help/what-are-assistance-requests"
        },
        {
          title: "Responding to Assistance Requests",
          description: "Best practices for fast, effective responses",
          link: "/help/responding-to-assistance"
        },
        {
          title: "Managing High Volume Requests",
          description: "Strategies for busy periods and multiple simultaneous requests",
          link: "/help/managing-high-volume"
        },
        {
          title: "Assistance Request Analytics",
          description: "Track response times and common request patterns",
          link: "/help/assistance-analytics"
        }
      ]
    },
    {
      category: "Customization",
      icon: Settings,
      color: "indigo",
      guides: [
        {
          title: "Branding Your Feedback Forms",
          description: "Upload logos and customize colors to match your brand",
          link: "/help/branding-feedback-forms"
        },
        {
          title: "Creating Effective Questions",
          description: "Write questions that get meaningful feedback",
          link: "/help/creating-effective-questions"
        },
        {
          title: "Question Types and Formats",
          description: "Choose the right question format for your needs",
          link: "/help/question-types-formats"
        },
        {
          title: "Setting Feedback Hours",
          description: "Configure when customers can leave feedback",
          link: "/help/setting-feedback-hours"
        }
      ]
    },
    {
      category: "Analytics & Reports",
      icon: BarChart3,
      color: "pink",
      guides: [
        {
          title: "Understanding Your Dashboard",
          description: "Navigate key metrics and performance indicators",
          link: "/help/understanding-dashboard"
        },
        {
          title: "Exporting Data",
          description: "Export feedback data to Excel, CSV, or PDF",
          link: "/help/exporting-data"
        },
        {
          title: "Setting Up Automated Reports",
          description: "Schedule weekly or monthly reports via email",
          link: "/help/automated-reports"
        },
        {
          title: "Trend Analysis",
          description: "Identify patterns and track improvements over time",
          link: "/help/trend-analysis"
        }
      ]
    },
    {
      category: "Team Management",
      icon: Users,
      color: "teal",
      guides: [
        {
          title: "User Roles Explained",
          description: "Admin, Manager, and Staff permissions overview",
          link: "/help/user-roles-explained"
        },
        {
          title: "Adding Team Members",
          description: "Invite staff and assign appropriate access levels",
          link: "/help/adding-team-members"
        },
        {
          title: "Managing Permissions",
          description: "Control who can access which features and venues",
          link: "/help/managing-permissions"
        },
        {
          title: "Removing Team Members",
          description: "Safely remove user access when staff leave",
          link: "/help/removing-team-members"
        }
      ]
    },
    {
      category: "Billing & Account",
      icon: CreditCard,
      color: "red",
      guides: [
        {
          title: "Understanding Plans",
          description: "Compare Starter, Growth, and Enterprise plans",
          link: "/help/understanding-plans"
        },
        {
          title: "Upgrading Your Plan",
          description: "Add more venues or unlock advanced features",
          link: "/help/upgrading-plan"
        },
        {
          title: "Managing Your Subscription",
          description: "Update payment methods and billing information",
          link: "/help/managing-subscription"
        },
        {
          title: "Cancellation & Data Export",
          description: "What happens when you cancel your account",
          link: "/help/cancellation-data-export"
        }
      ]
    },
    {
      category: "Troubleshooting",
      icon: HelpCircle,
      color: "yellow",
      guides: [
        {
          title: "Common Issues & Solutions",
          description: "Quick fixes for the most frequent problems",
          link: "/help/common-issues"
        },
        {
          title: "No Feedback Appearing",
          description: "Troubleshoot missing or delayed feedback",
          link: "/help/no-feedback-appearing"
        },
        {
          title: "Kiosk Mode Not Updating",
          description: "Fix real-time sync issues with your dashboard",
          link: "/help/kiosk-not-updating"
        },
        {
          title: "Browser Compatibility",
          description: "Supported browsers and device requirements",
          link: "/help/browser-compatibility"
        }
      ]
    },
    {
      category: "Security & Privacy",
      icon: Shield,
      color: "gray",
      guides: [
        {
          title: "Data Security Overview",
          description: "How we protect your customer feedback data",
          link: "/help/data-security-overview"
        },
        {
          title: "GDPR Compliance",
          description: "Privacy controls and data protection measures",
          link: "/help/gdpr-compliance"
        },
        {
          title: "User Access Security",
          description: "Best practices for account and password security",
          link: "/help/user-access-security"
        },
        {
          title: "Data Retention Policy",
          description: "How long we store your feedback data",
          link: "/help/data-retention-policy"
        }
      ]
    }
  ];

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "bg-blue-100 text-blue-600",
      hover: "hover:bg-blue-100"
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "bg-green-100 text-green-600",
      hover: "hover:bg-green-100"
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "bg-purple-100 text-purple-600",
      hover: "hover:bg-purple-100"
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "bg-orange-100 text-orange-600",
      hover: "hover:bg-orange-100"
    },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      icon: "bg-indigo-100 text-indigo-600",
      hover: "hover:bg-indigo-100"
    },
    pink: {
      bg: "bg-pink-50",
      border: "border-pink-200",
      icon: "bg-pink-100 text-pink-600",
      hover: "hover:bg-pink-100"
    },
    teal: {
      bg: "bg-teal-50",
      border: "border-teal-200",
      icon: "bg-teal-100 text-teal-600",
      hover: "hover:bg-teal-100"
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "bg-red-100 text-red-600",
      hover: "hover:bg-red-100"
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: "bg-yellow-100 text-yellow-600",
      hover: "hover:bg-yellow-100"
    },
    gray: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: "bg-gray-100 text-gray-600",
      hover: "hover:bg-gray-100"
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Help Guides | Chatters - Complete User Guide & Support</title>
        <meta
          name="description"
          content="Browse comprehensive help guides for Chatters customer feedback platform. Find step-by-step tutorials, best practices, and solutions for all features."
        />
        <meta
          name="keywords"
          content="chatters help guides, customer feedback tutorials, qr code setup guide, kiosk mode help, restaurant feedback system guides"
        />
        <meta property="og:title" content="Help Guides | Chatters" />
        <meta property="og:description" content="Browse comprehensive help guides and tutorials for the Chatters customer feedback platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/help-new" />
      </Helmet>

      <Navbar overlay/>

      {/* Hero Section - Duplicate from /help */}
      <PageHeader
        title="Chatters Help Center"
        description="Find answers, guides, and support to get the most out of Chatters. Browse our help articles or reach out to our team if you need assistance."
        backgroundGradient="from-white to-blue-50"
        showSubtitle={true}
        subtitle="Support & Resources"
      />

      {/* Help Guides Section - Intercom Style */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          {/* Introduction */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4 font-satoshi">
              Browse Help Guides
            </h2>
            <p className="text-xl text-gray-600 font-satoshi max-w-3xl mx-auto">
              Find step-by-step tutorials and best practices for every feature. Click any guide to learn more.
            </p>
          </div>

          {/* Help Guide Categories */}
          <div className="space-y-16">
            {helpGuides.map((category, categoryIndex) => {
              const colors = colorClasses[category.color];

              return (
                <div key={categoryIndex} className="space-y-6">
                  {/* Category Header */}
                  <div className="flex items-center space-x-3">
                    <h3 className="text-2xl font-bold text-primary font-satoshi">
                      {category.category}
                    </h3>
                  </div>

                  {/* Guide Cards Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {category.guides.map((guide, guideIndex) => (
                      <a
                        key={guideIndex}
                        href={guide.link}
                        className={`block p-6 rounded-xl border ${colors.border} ${colors.bg} ${colors.hover} transition-all duration-200 group`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-primary mb-2 font-satoshi group-hover:text-brand transition-colors">
                              {guide.title}
                            </h4>
                            <p className="text-gray-600 font-satoshi text-sm">
                              {guide.description}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-4" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Still Need Help CTA */}
          <div className="mt-24 text-center">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-12 border border-green-200">
              <BookOpen className="w-16 h-16 text-brand mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-primary mb-4 font-satoshi">
                Still need help?
              </h3>
              <p className="text-xl text-gray-700 mb-8 font-satoshi max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to help you with any questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/help#contact"
                  className="btn-primary font-satoshi inline-flex items-center justify-center"
                >
                  Contact Support
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
                <a
                  href="/help#faq"
                  className="btn-secondary font-satoshi inline-flex items-center justify-center"
                >
                  View FAQ
                  <HelpCircle className="ml-2 w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <a href="/help" className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <FileText className="w-8 h-8 text-brand mx-auto mb-3" />
              <h4 className="font-semibold text-primary mb-2 font-satoshi">Full Documentation</h4>
              <p className="text-sm text-gray-600 font-satoshi">Complete help center with detailed guides</p>
            </a>

            <a href="/contact" className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <MessageSquare className="w-8 h-8 text-brand mx-auto mb-3" />
              <h4 className="font-semibold text-primary mb-2 font-satoshi">Contact Us</h4>
              <p className="text-sm text-gray-600 font-satoshi">Get in touch with our team directly</p>
            </a>

            <a href="/security" className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <Shield className="w-8 h-8 text-brand mx-auto mb-3" />
              <h4 className="font-semibold text-primary mb-2 font-satoshi">Security</h4>
              <p className="text-sm text-gray-600 font-satoshi">Learn about our security measures</p>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HelpNewPage;
