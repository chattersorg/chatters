import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { HelpCircle, Play, Settings, Smartphone, Zap, BarChart3, Users, FileText, MessageSquare, AlertTriangle, Globe, Shield, Clock, CheckCircle, Code, ArrowRight, Search, BookOpen, Phone, Mail } from 'lucide-react';
import Navbar from '../../components/marketing/layout/Navbar';
import PageHeader from '../../components/marketing/common/sections/PageHeader';
import Footer from '../../components/marketing/layout/Footer';

const HelpPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Scroll spy functionality
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'overview', 'getting-started', 'qr-codes', 'kiosk-mode', 'assistance-requests', 
        'troubleshooting', 'customisation', 'analytics', 'billing', 'team-management',
        'training', 'faq', 'contact'
      ];
      
      const scrollPosition = window.scrollY + 100;
      
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sidebarItems = [
    { id: 'overview', title: 'Overview', icon: HelpCircle },
    { id: 'getting-started', title: 'Getting Started', icon: Play },
    { id: 'qr-codes', title: 'QR Codes & Setup', icon: Smartphone },
    { id: 'kiosk-mode', title: 'Kiosk Mode', icon: MessageSquare },
    { id: 'assistance-requests', title: 'Assistance Requests', icon: Zap },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
    { id: 'customisation', title: 'customisation', icon: Settings },
    { id: 'analytics', title: 'Analytics & Reports', icon: BarChart3 },
    { id: 'billing', title: 'Billing & Account', icon: FileText },
    { id: 'team-management', title: 'Team Management', icon: Users },
    { id: 'training', title: 'Training Resources', icon: BookOpen },
    { id: 'faq', title: 'FAQ', icon: HelpCircle },
    { id: 'contact', title: 'Contact Support', icon: Phone }
  ];

  const quickStartSteps = [
    { step: 1, title: "Set Up Your First Venue", desc: "Add your venue details and upload your logo" },
    { step: 2, title: "Create Questions", desc: "Add 2-3 simple questions about your service" },
    { step: 3, title: "Generate Your QR Code", desc: "Download and print your unique QR code" },
    { step: 4, title: "Test Your System", desc: "Scan and complete a test feedback submission" }
  ];

  const troubleshootingIssues = [
    {
      issue: "QR Code Not Working",
      solutions: [
        "Re-download QR code if image is blurry",
        "Ensure QR code is minimum 2cm x 2cm",
        "Check lighting conditions where code is placed",
        "Verify venue is active in settings"
      ]
    },
    {
      issue: "No Feedback Appearing",
      solutions: [
        "Check feedback hours are set correctly",
        "Ensure questions are marked as 'Active'",
        "Refresh browser page (F5 or Ctrl+R)",
        "Verify you're viewing the correct venue"
      ]
    },
    {
      issue: "Kiosk Mode Not Updating",
      solutions: [
        "Refresh the page and check internet connection",
        "Clear browser cache and cookies",
        "Try using Chrome browser",
        "Log out and back in to reset session"
      ]
    }
  ];

  const faqItems = [
    {
      question: "How quickly can I get Chatters running?",
      answer: "Most customers are collecting feedback within 10-15 minutes of signup. You just need to create your venue, add 2-3 questions, download your QR code, and place it on tables."
    },
    {
      question: "Do customers need to download an app?",
      answer: "No! Customers simply scan your QR code with their phone's camera app. No downloads required - it works through their mobile browser."
    },
    {
      question: "How do I handle negative feedback?",
      answer: "Negative feedback is an opportunity! Our system highlights urgent issues so you can address problems immediately while customers are still in your venue, turning negative experiences into positive ones."
    },
    {
      question: "Can I try Chatters before paying?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start."
    },
    {
      question: "What if my internet goes down?",
      answer: "Customers won't be able to submit feedback without internet, but as soon as connection is restored, everything works normally. No data is lost."
    },
    {
      question: "How many feedback responses should I expect?",
      answer: "Response rates vary by industry and setup, but most customers see 10-20% of their customers leaving feedback. Clear QR code placement and staff encouragement help increase rates."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Help Center | Chatters - Complete User Guide & Support</title>
        <meta 
          name="description" 
          content="Complete help guide for Chatters customer feedback platform. Learn setup, troubleshooting, customisation, and best practices for restaurants and hospitality businesses."
        />
        <meta 
          name="keywords" 
          content="chatters help, customer feedback help, qr code setup, kiosk mode guide, restaurant feedback system"
        />
        <meta property="og:title" content="Help Center | Chatters" />
        <meta property="og:description" content="Complete user guide and support documentation for the Chatters customer feedback platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/help" />
      </Helmet>

      <Navbar overlay/>

      {/* Hero Section */}
      <PageHeader
        title="Chatters Help Center"
        description="Find answers, guides, and support to get the most out of Chatters. Browse our help articles or reach out to our team if you need assistance."
        backgroundGradient="from-white to-blue-50"
        showSubtitle={true}
        subtitle="Support & Resources"
      />

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Sidebar Navigation */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-primary mb-6 font-satoshi">Help Topics</h3>
                  <nav className="space-y-2">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 font-satoshi ${
                            activeSection === item.id
                              ? 'bg-green-600 text-white font-semibold'
                              : 'hover:bg-gray-100 text-gray-700 hover:text-green-600'
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">{item.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-none prose prose-lg">
              
              {/* Overview Section */}
              <section id="overview" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <HelpCircle className="w-8 h-8 mr-3 text-brand" />
                  Welcome to Chatters Help Center
                </h2>
                <div className="bg-gray-50 rounded-2xl p-8 mb-8">
                  <p className="text-gray-700 text-lg leading-relaxed font-satoshi mb-6">
                    Chatters is a real-time customer feedback management platform designed specifically for restaurants, hotels, and hospitality businesses. This comprehensive guide will help you get started and make the most of all our features.
                  </p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Play className="w-6 h-6 text-brand" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary mb-2 font-satoshi">Quick Setup</h4>
                        <p className="text-gray-600 text-sm font-satoshi">Get running in under 10 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-brand" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary mb-2 font-satoshi">No App Required</h4>
                        <p className="text-gray-600 text-sm font-satoshi">Customers use their phone camera</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-brand" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary mb-2 font-satoshi">Real-Time Alerts</h4>
                        <p className="text-gray-600 text-sm font-satoshi">Instant notifications for issues</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Getting Started Section */}
              <section id="getting-started" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <Play className="w-8 h-8 mr-3 text-brand" />
                  Getting Started
                </h2>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Quick Setup Guide</h3>
                  <p className="text-gray-700 mb-6 font-satoshi">Get your feedback system running in under 10 minutes with these simple steps:</p>
                  
                  <div className="space-y-6">
                    {quickStartSteps.map((item) => (
                      <div key={item.step} className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl">
                        <div className="flex-shrink-0 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center text-lg font-bold">
                          {item.step}
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary font-satoshi text-lg">{item.title}</h4>
                          <p className="text-gray-700 font-satoshi mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-blue-50 border-l-4 border-brand rounded-r-xl">
                    <h4 className="font-semibold text-primary mb-2 font-satoshi">What You'll Need:</h4>
                    <ul className="text-gray-700 space-y-1 font-satoshi">
                      <li>• Your Chatters account login credentials</li>
                      <li>• Venue information (name, address, number of tables)</li>
                      <li>• Your logo (optional, for branding)</li>
                      <li>• A device to display your QR code (tablet, printed card, etc.)</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* QR Codes Section */}
              <section id="qr-codes" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <Smartphone className="w-8 h-8 mr-3 text-brand" />
                  QR Codes & Setup
                </h2>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">QR Code Best Practices</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-brand mb-3 font-satoshi flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Do These Things:
                      </h4>
                      <ul className="space-y-2 text-gray-700 font-satoshi">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                          <span>Place on tables, receipts, or wall displays</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                          <span>Ensure good lighting and clear visibility</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                          <span>Include simple instructions: "Scan to leave feedback"</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                          <span>Make it minimum 2cm x 2cm in size</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-red-600 mb-3 font-satoshi flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Avoid These Mistakes:
                      </h4>
                      <ul className="space-y-2 text-gray-700 font-satoshi">
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>Placing where it might get wet or damaged</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>Making it too small (hard to scan)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>Placing behind objects or in hard-to-reach areas</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>Using blurry or low-quality prints</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">Suggested Customer Instructions:</h4>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-gray-700 font-satoshi italic text-center">
                        "Scan with your phone camera to share quick feedback about your experience"
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Kiosk Mode Section */}
              <section id="kiosk-mode" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <MessageSquare className="w-8 h-8 mr-3 text-brand" />
                  Kiosk Mode - Your Real-Time Dashboard
                </h2>
                
                <div className="mb-8">
                  <div className="bg-blue-50 border-l-4 border-brand p-6 mb-6 rounded-r-xl">
                    <p className="text-gray-700 mb-4 font-satoshi">
                      Kiosk mode is your real-time feedback dashboard that gives your staff instant alerts when customers need attention.
                    </p>
                    <p className="text-gray-700 font-satoshi">
                      <strong>Access:</strong> Go to my.getchatters.com/kiosk and log in with your credentials
                    </p>
                  </div>

                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Understanding Your Dashboard</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Left Sidebar: Active Alerts</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span className="text-gray-700 font-satoshi"><strong>Red = Urgent:</strong> Low ratings (1-2 stars) - respond immediately</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-700 font-satoshi"><strong>Yellow = Attention:</strong> Medium ratings with comments</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700 font-satoshi"><strong>Blue = Info:</strong> General feedback to review</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Right Side: Floor Plan</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          <span className="text-gray-700 font-satoshi">Red tables: Urgent negative feedback</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                          <span className="text-gray-700 font-satoshi">Yellow tables: Feedback needing attention</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="text-gray-700 font-satoshi">Green tables: Positive feedback</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-gray-400 rounded"></div>
                          <span className="text-gray-700 font-satoshi">Gray tables: No recent feedback</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">Best Practices for Staff:</h4>
                    <ul className="text-gray-700 space-y-2 font-satoshi">
                      <li>• Check kiosk mode every 10-15 minutes during service</li>
                      <li>• Respond to red alerts within 5 minutes</li>
                      <li>• Always acknowledge assistance requests immediately</li>
                      <li>• Train all staff on the color-coded system</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Assistance Requests Section */}
              <section id="assistance-requests" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <Zap className="w-8 h-8 mr-3 text-brand" />
                  Managing Assistance Requests
                </h2>
                
                <div className="mb-8">
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mb-6 rounded-r-xl">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">What are Assistance Requests?</h4>
                    <p className="text-gray-700 font-satoshi mb-4">
                      When customers need help but don't want to leave formal feedback, they can click "Just need assistance?" This creates an urgent orange alert at the top of your kiosk.
                    </p>
                    <p className="text-gray-700 font-satoshi">
                      <strong>Target Response Time:</strong> Under 2 minutes (maximum 5 minutes)
                    </p>
                  </div>

                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">How It Works</h3>
                  <div className="space-y-4 mb-8">
                    {[
                      "Customer scans QR code and enters table number",
                      "Customer clicks 'Just need assistance?' instead of answering questions", 
                      "Orange alert appears immediately in your kiosk",
                      "Staff acknowledges they've seen the request",
                      "Staff goes to table to provide assistance",
                      "Staff marks as resolved when complete"
                    ].map((step, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 font-satoshi">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Common Assistance Requests:</h4>
                      <ul className="text-gray-700 space-y-2 font-satoshi">
                        <li>• Need to place an order</li>
                        <li>• Ready for the bill</li>
                        <li>• Spilled something</li>
                        <li>• Question about menu items</li>
                        <li>• Need extra napkins/cutlery</li>
                        <li>• Have a complaint to resolve</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Staff Training Tips:</h4>
                      <ul className="text-gray-700 space-y-2 font-satoshi">
                        <li>• Always acknowledge the request first</li>
                        <li>• Send the most appropriate staff member</li>
                        <li>• Be proactive - ask "How can I help?"</li>
                        <li>• Resolve the issue completely before marking as resolved</li>
                        <li>• Follow up: "Is there anything else I can help with?"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Troubleshooting Section */}
              <section id="troubleshooting" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <AlertTriangle className="w-8 h-8 mr-3 text-brand" />
                  Common Issues & Quick Fixes
                </h2>
                
                <div className="mb-8">
                  <p className="text-gray-700 mb-6 font-satoshi">
                    Solve the most frequent problems instantly with these troubleshooting guides.
                  </p>
                  
                  <div className="space-y-8">
                    {troubleshootingIssues.map((item, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h4 className="font-semibold text-red-800 mb-4 font-satoshi text-lg flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          {item.issue}
                        </h4>
                        <div className="space-y-2">
                          {item.solutions.map((solution, sIndex) => (
                            <div key={sIndex} className="flex items-start space-x-3">
                              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 font-satoshi">{solution}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 bg-blue-50 border-l-4 border-brand p-6 rounded-r-xl">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">Still having issues?</h4>
                    <p className="text-gray-700 font-satoshi">
                      Include your venue name and describe what you're seeing when contacting support. Our team responds to technical issues within 24 hours.
                    </p>
                  </div>
                </div>
              </section>

              {/* customisation Section */}
              <section id="customisation" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <Settings className="w-8 h-8 mr-3 text-brand" />
                  customisation
                </h2>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Branding Your Feedback Forms</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Upload Your Logo:</h4>
                      <ol className="text-gray-700 space-y-2 font-satoshi list-decimal list-inside">
                        <li>Go to Venue Settings → Branding</li>
                        <li>Click "Upload Logo"</li>
                        <li>Choose a clear, high-quality image</li>
                        <li>Best size: 200x80 pixels, PNG or JPG</li>
                        <li>Preview how it looks on feedback forms</li>
                      </ol>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Brand Colors:</h4>
                      <ol className="text-gray-700 space-y-2 font-satoshi list-decimal list-inside">
                        <li>Set your primary color (buttons, headers)</li>
                        <li>Set your secondary color (backgrounds)</li>
                        <li>Preview changes in real-time</li>
                        <li>Save when satisfied with appearance</li>
                      </ol>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Creating Effective Questions</h3>
                  
                  <div className="bg-blue-50 border-l-4 border-brand p-6 mb-6 rounded-r-xl">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">Question Best Practices:</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-brand mb-2 font-satoshi">✅ Do:</h5>
                        <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                          <li>• Keep it simple: "How was your food?"</li>
                          <li>• Be specific about different aspects</li>
                          <li>• Use 3-5 questions maximum</li>
                          <li>• Use clear, everyday language</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-red-600 mb-2 font-satoshi">❌ Avoid:</h5>
                        <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                          <li>• Complex: "Please rate the culinary experience"</li>
                          <li>• Too many questions (customers won't complete)</li>
                          <li>• Jargon or technical terms</li>
                          <li>• Vague questions</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Example: Restaurant Questions</h4>
                      <ol className="text-gray-700 space-y-2 font-satoshi list-decimal list-inside">
                        <li>"How was your food quality?"</li>
                        <li>"How was our service?"</li>
                        <li>"How was the atmosphere?"</li>
                      </ol>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Example: Hotel Questions</h4>
                      <ol className="text-gray-700 space-y-2 font-satoshi list-decimal list-inside">
                        <li>"How was your check-in experience?"</li>
                        <li>"How was your room?"</li>
                        <li>"How was our staff service?"</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </section>

              {/* Analytics Section */}
              <section id="analytics" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <BarChart3 className="w-8 h-8 mr-3 text-brand" />
                  Analytics & Reports
                </h2>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Key Metrics Overview</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">What Good Numbers Look Like:</h4>
                      <ul className="text-gray-700 space-y-2 font-satoshi">
                        <li><strong>Overall rating:</strong> 4.0+ stars</li>
                        <li><strong>Response rate:</strong> 15%+ of customers</li>
                        <li><strong>Resolution rate:</strong> 90%+ of issues addressed</li>
                        <li><strong>Negative feedback:</strong> Under 10% of total</li>
                      </ul>
                    </div>
                    
                    <div className="bg-red-50 rounded-xl p-6">
                      <h4 className="font-semibold text-red-700 mb-4 font-satoshi">Warning Signs:</h4>
                      <ul className="text-gray-700 space-y-2 font-satoshi">
                        <li><strong>Declining ratings:</strong> Downward trend over time</li>
                        <li><strong>Slow response times:</strong> Issues not addressed quickly</li>
                        <li><strong>Recurring complaints:</strong> Same problems repeatedly</li>
                        <li><strong>Low resolution rate:</strong> Issues not being fixed</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Exporting Your Data</h3>
                  
                  <div className="bg-blue-50 border-l-4 border-brand p-6 rounded-r-xl">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">Available Export Formats:</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-semibold text-primary mb-2 font-satoshi">Excel/CSV Files:</h5>
                        <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                          <li>• Raw feedback data</li>
                          <li>• Summary reports</li>
                          <li>• Staff performance</li>
                          <li>• Table analysis</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-primary mb-2 font-satoshi">PDF Reports:</h5>
                        <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                          <li>• Executive summary</li>
                          <li>• Detailed analysis</li>
                          <li>• Custom date ranges</li>
                          <li>• Branded reports</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-primary mb-2 font-satoshi">Automated Reports:</h5>
                        <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                          <li>• Weekly summaries</li>
                          <li>• Monthly overviews</li>
                          <li>• Alert reports</li>
                          <li>• Custom schedules</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Billing Section */}
              <section id="billing" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <FileText className="w-8 h-8 mr-3 text-brand" />
                  Billing & Account Management
                </h2>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Current Plans</h3>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-2 font-satoshi">Starter</h4>
                      <p className="text-gray-600 text-sm font-satoshi mb-3">1 venue, basic features</p>
                      <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                        <li>• Up to 50 tables</li>
                        <li>• Real-time alerts</li>
                        <li>• Basic analytics</li>
                        <li>• Email support</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-2 font-satoshi">Growth</h4>
                      <p className="text-gray-600 text-sm font-satoshi mb-3">Up to 5 venues, advanced analytics</p>
                      <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                        <li>• Up to 200 tables</li>
                        <li>• Advanced analytics</li>
                        <li>• Multi-location support</li>
                        <li>• Priority support</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-2 font-satoshi">Enterprise</h4>
                      <p className="text-gray-600 text-sm font-satoshi mb-3">Unlimited venues, white-label options</p>
                      <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                        <li>• Unlimited tables</li>
                        <li>• White-label solution</li>
                        <li>• Dedicated account manager</li>
                        <li>• Custom integrations</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-brand p-6 rounded-r-xl">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">Trial & Cancellation:</h4>
                    <ul className="text-gray-700 space-y-2 font-satoshi">
                      <li><strong>Free Trial:</strong> 14 days free on any plan, no credit card required</li>
                      <li><strong>Cancellation:</strong> Cancel anytime from Settings → Billing, no cancellation fees</li>
                      <li><strong>Data Export:</strong> All data automatically exported before cancellation</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Team Management Section */}
              <section id="team-management" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <Users className="w-8 h-8 mr-3 text-brand" />
                  Team Management
                </h2>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">User Roles Explained</h3>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-red-50 rounded-xl p-6">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-red-600" />
                      </div>
                      <h4 className="font-semibold text-primary mb-2 font-satoshi">Admin</h4>
                      <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                        <li>• Full access to all venues</li>
                        <li>• Can add/remove team members</li>
                        <li>• Access to billing and account settings</li>
                        <li>• Can create new venues</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 rounded-xl p-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-primary mb-2 font-satoshi">Manager</h4>
                      <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                        <li>• Access to assigned venues only</li>
                        <li>• Can manage feedback and kiosk mode</li>
                        <li>• Can edit venue settings</li>
                        <li>• Cannot access billing</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 rounded-xl p-6">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-primary mb-2 font-satoshi">Staff</h4>
                      <ul className="text-gray-700 space-y-1 font-satoshi text-sm">
                        <li>• Kiosk mode access only</li>
                        <li>• Can view and resolve feedback</li>
                        <li>• Can handle assistance requests</li>
                        <li>• Cannot change settings</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Adding Team Members</h3>
                  
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">Step-by-Step Process:</h4>
                    <ol className="text-gray-700 space-y-2 font-satoshi list-decimal list-inside">
                      <li>Go to <strong>Settings → Staff Management</strong></li>
                      <li>Click <strong>"Invite User"</strong></li>
                      <li>Enter their <strong>email address</strong></li>
                      <li>Select their <strong>role</strong> (Admin/Manager/Staff)</li>
                      <li><strong>Assign venues</strong> (for Managers and Staff)</li>
                      <li>Click <strong>"Send Invitation"</strong></li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-brand p-6 rounded-r-xl">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">Security Best Practices:</h4>
                    <ul className="text-gray-700 space-y-2 font-satoshi">
                      <li>• Give minimum required access - start with Staff role, upgrade as needed</li>
                      <li>• Use work email addresses only</li>
                      <li>• Remove access for departed employees immediately</li>
                      <li>• Don't share login credentials</li>
                      <li>• Review permissions quarterly</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Training Section */}
              <section id="training" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <BookOpen className="w-8 h-8 mr-3 text-brand" />
                  Training Resources
                </h2>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Available Training Options</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Free Resources:</h4>
                      <ul className="text-gray-700 space-y-2 font-satoshi">
                        <li><strong>Setup session:</strong> All new customers get 30-minute onboarding</li>
                        <li><strong>Help documentation:</strong> Comprehensive guides (this page!)</li>
                        <li><strong>Video library:</strong> Self-paced learning tutorials</li>
                        <li><strong>Webinars:</strong> Monthly feature overviews</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4 font-satoshi">Premium Support:</h4>
                      <ul className="text-gray-700 space-y-2 font-satoshi">
                        <li><strong>Staff training:</strong> On-site or virtual team training</li>
                        <li><strong>Custom consultation:</strong> Tailored to your business</li>
                        <li><strong>Dedicated support:</strong> Enterprise customers get priority</li>
                        <li><strong>Implementation help:</strong> Assistance with complex setups</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-primary mb-4 font-satoshi">Training Success Tips</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-3 font-satoshi">For Managers:</h4>
                      <ul className="text-gray-700 space-y-2 font-satoshi">
                        <li>• Start with basics - ensure foundation knowledge first</li>
                        <li>• Practice regularly - use the system daily</li>
                        <li>• Share insights - discuss feedback patterns with team</li>
                        <li>• Celebrate wins - recognise staff who excel</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-3 font-satoshi">For Staff:</h4>
                      <ul className="text-gray-700 space-y-2 font-satoshi">
                        <li>• Ask questions - no question is too basic</li>
                        <li>• Practice together - train as a team</li>
                        <li>• Use real examples - apply training to actual feedback</li>
                        <li>• Stay updated - attend refresher sessions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section id="faq" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <HelpCircle className="w-8 h-8 mr-3 text-brand" />
                  Frequently Asked Questions
                </h2>
                
                <div className="mb-8">
                  <p className="text-gray-700 mb-6 font-satoshi">
                    Quick answers to the most common questions about Chatters.
                  </p>
                  
                  <div className="space-y-6">
                    {faqItems.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-6">
                        <h4 className="font-semibold text-primary mb-3 font-satoshi text-lg">
                          Q: {item.question}
                        </h4>
                        <p className="text-gray-700 font-satoshi">
                          <strong>A:</strong> {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 text-center p-8 bg-green-50 rounded-xl">
                    <h4 className="font-semibold text-primary mb-3 font-satoshi">Don't see your question here?</h4>
                    <p className="text-gray-700 font-satoshi mb-4">
                      Contact our support team - we're happy to help with any questions, no matter how small.
                    </p>
                    <a 
                      href="#contact" 
                      className="btn-primary font-satoshi inline-flex items-center"
                      onClick={() => scrollToSection('contact')}
                    >
                      Contact Support
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </a>
                  </div>
                </div>
              </section>

              {/* Contact Support Section */}
              <section id="contact" className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 font-satoshi flex items-center">
                  <Phone className="w-8 h-8 mr-3 text-brand" />
                  Contact Support
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-primary mb-2 font-satoshi">Email Support</h4>
                    <p className="text-sm text-gray-700 mb-2 font-satoshi">support@getchatters.com</p>
                    <p className="text-sm text-gray-700 mb-2 font-satoshi">Response Time: 24-48 hours</p>
                    <p className="text-sm text-gray-700 font-satoshi">Best for: Non-urgent questions</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-primary mb-2 font-satoshi">Live Chat</h4>
                    <p className="text-sm text-gray-700 mb-2 font-satoshi">Monday-Friday, 9 AM - 6 PM GMT</p>
                    <p className="text-sm text-gray-700 mb-2 font-satoshi">Response Time: Under 5 minutes</p>
                    <p className="text-sm text-gray-700 font-satoshi">Best for: Quick questions, urgent issues</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <Phone className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-primary mb-2 font-satoshi">Phone Support</h4>
                    <p className="text-sm text-gray-700 mb-2 font-satoshi">Enterprise customers only</p>
                    <p className="text-sm text-gray-700 mb-2 font-satoshi">Monday-Friday, 9 AM - 5 PM GMT</p>
                    <p className="text-sm text-gray-700 font-satoshi">Best for: Critical issues, training</p>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-brand p-6 rounded-r-xl">
                  <h4 className="font-semibold text-primary mb-3 font-satoshi">When Contacting Support, Include:</h4>
                  <ul className="text-gray-700 space-y-2 font-satoshi">
                    <li>• Your venue name or account email</li>
                    <li>• Screenshot of any error messages</li>
                    <li>• Steps you've already tried</li>
                    <li>• Browser and device type</li>
                    <li>• Urgency level (Critical, High, Medium, Low)</li>
                  </ul>
                </div>

                {/* Document Info */}
                <div className="border-t-2 border-gray-200 pt-8 mt-16">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="text-center text-gray-600 font-satoshi">
                      <p className="mb-2"><strong>Help Center Version:</strong> 1.0</p>
                      <p className="mb-2"><strong>Last Updated:</strong> August 2025</p>
                      <p className="mb-2"><strong>Review Schedule:</strong> Bi-monthly</p>
                      <p><strong>Next Review:</strong> October 2025</p>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HelpPage;