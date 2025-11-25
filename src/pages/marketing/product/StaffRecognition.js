import React from 'react';
import { Helmet } from 'react-helmet';
import { Trophy, Mail, TrendingUp, Award, Users, Star } from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import PageHeader from '../../../components/marketing/common/sections/PageHeader';
import ContentSplit from '../../../components/marketing/common/sections/ContentSplit';
import ProductFeaturesShowcase from '../../../components/marketing/common/sections/ProductFeaturesShowcase';
import FeatureGrid from '../../../components/marketing/common/sections/FeatureGrid';
import FAQSection from '../../../components/marketing/common/sections/FAQSection';
import CTA from '../../../components/marketing/common/sections/CTA';
import Footer from '../../../components/marketing/layout/Footer';

const StaffRecognitionPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Staff Recognition System | Chatters - Reward Top Performers Automatically</title>
        <meta
          name="description"
          content="Boost team morale with automated staff recognition emails. Celebrate top performers, track feedback resolutions, and motivate employees with performance-based rewards in hospitality."
        />
        <meta
          name="keywords"
          content="staff recognition, employee rewards, team motivation, performance recognition, hospitality staff management, employee engagement, automated recognition, staff performance tracking"
        />
        <meta property="og:title" content="Staff Recognition System | Chatters" />
        <meta property="og:description" content="Automatically recognise and reward your top-performing staff with personalised emails based on customer feedback resolution and performance metrics." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/staff-recognition" />
      </Helmet>

      <Navbar overlay />

      <PageHeader
        title="Recognise and Reward Your Top Performers Automatically"
        description="Turn exceptional customer service into celebrated achievements. Send personalised recognition emails to staff who go above and beyond, boosting morale and motivation across your team."
        backgroundGradient="from-white to-green-200"
        showSubtitle={true}
        subtitle="Staff Recognition"
      />

      <ContentSplit
        eyebrow="Employee Recognition"
        eyebrowColour='text-green-600'
        title="Celebrate success with one click."
        description="See who's resolving the most customer feedback and send beautiful, personalised recognition emails instantly. Turn performance data into meaningful appreciation that motivates your entire team."
        bullets={[
          "One-click recognition emails",
          "Performance-based rewards",
          "Personalised manager messages",
          "Track recognition history"
        ]}
        primaryCta={{ label: "Start recognising", to: "/signup" }}
        secondaryCta={{ label: "See demo", to: "/demo" }}
        image={{ src: "/img/product_pages/staffrecognition/hero.png", alt: "Staff recognition interface" }}
      />

      <ProductFeaturesShowcase
        eyebrow="Recognition Made Simple"
        eyebrowColour='text-green-600'
        title="From performance data to heartfelt recognition."
        description="Transform your staff leaderboard into a powerful recognition tool. Identify top performers, craft personal messages, and send beautiful branded emails that employees will actually appreciate."
        primaryCta={{ label: "Try recognition", to: "/signup" }}
        secondaryCta={{ label: "View examples", to: "/demo" }}
        features={[
          {
            id: "automated",
            eyebrow: "Smart Recognition",
            title: "Identify top performers automatically",
            description: "See who's ranked highest for feedback resolution, assistance requests, and customer satisfaction. Filter by day, week, or month to recognise timely achievements.",
            bullets: ["Real-time leaderboards", "Custom time periods", "Performance rankings"],
            image: { src: "/img/mock-metrics.png", alt: "Performance leaderboard dashboard" },
          },
          {
            id: "personalized",
            eyebrow: "Personal Touch",
            title: "Add your own personal message",
            description: "Include a heartfelt note from management that makes recognition meaningful. Your personal message appears in a beautiful branded email with their performance stats.",
            bullets: ["Custom manager messages", "Performance stats included", "Beautiful email templates"],
            image: { src: "/img/mock-badges.png", alt: "Personalised recognition email" },
          },
          {
            id: "tracking",
            eyebrow: "Recognition History",
            title: "Track who you've recognised and when",
            description: "Never miss recognising a top performer. See recognition history, track patterns, and ensure fair appreciation across your team.",
            bullets: ["Recognition logs", "Frequency tracking", "Fair distribution"],
            image: { src: "/img/mock-competition.png", alt: "Recognition tracking interface" },
          },
        ]}
      />

      <FeatureGrid
        eyebrow="Recognition Benefits"
        eyebrowColour='text-green-600'
        title="Why recognition drives better performance"
        description="Motivated staff deliver better customer experiences. Recognition creates a positive feedback loop that benefits employees, customers, and your bottom line."
        gradientDirection="bg-gradient-to-b"
        backgroundGradient="from-white to-green-50"
        dottedBackground={true}
        orbGlow
        cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
        items={[
          {
            icon: <Trophy className="w-6 h-6 text-green-600" />,
            title: "Boost team morale",
            description:
              "Recognition emails make employees feel valued and appreciated, improving job satisfaction and reducing turnover.",
          },
          {
            icon: <Mail className="w-6 h-6 text-green-600" />,
            title: "Professional recognition",
            description:
              "Beautiful branded emails with performance stats and personal messages create memorable recognition moments.",
          },
          {
            icon: <TrendingUp className="w-6 h-6 text-green-600" />,
            title: "Encourage excellence",
            description:
              "When staff see peers recognised for great work, it motivates everyone to deliver exceptional customer service.",
          },
          {
            icon: <Award className="w-6 h-6 text-green-600" />,
            title: "Data-driven fairness",
            description:
              "Recognition based on real performance data ensures fairness and credibility in your reward system.",
          },
          {
            icon: <Users className="w-6 h-6 text-green-600" />,
            title: "Strengthen culture",
            description:
              "Regular recognition builds a culture of appreciation and excellence across your entire organisation.",
          },
          {
            icon: <Star className="w-6 h-6 text-green-600" />,
            title: "Retain top talent",
            description:
              "Employees who feel recognised and valued are more likely to stay, reducing costly turnover.",
          },
        ]}
        wavyBottom={true}
      />

      <FAQSection
        eyebrow="Recognition FAQ"
        eyebrowColour='text-green-600'
        title="Everything you need to know"
        description="If you have a different question, contact us and we'll help."
        dottedBackground
        orbGlow
        wavyBottom={false}
        backgroundGradient="from-white via-white to-green-50"
        gradientDirection="bg-gradient-to-b"
        defaultOpenIndex={0}
        faqs={[
          { q: "What triggers a staff recognition?", a: "You choose when to recognise staff based on leaderboard rankings. See top performers for any time period and send recognition with one click." },
          { q: "Can I customise the recognition email?", a: "Yes! Add your own personal message that appears alongside their performance stats in a beautifully branded email template." },
          { q: "What performance metrics are included?", a: "Recognition emails show feedback resolved, assistance requests handled, total resolutions, rank, and the time period they excelled in." },
          { q: "Is recognition history tracked?", a: "Yes, all recognition emails are logged so you can see who was recognised, when, and for what performance period." },
        ]}
      />

      <CTA
        title="Start recognising your top performers today"
        subtitle="Boost morale, motivation, and customer service excellence with automated staff recognition."
        buttonText="Book a Demo"
        buttonLink="/demo"
        gradientDirection="bg-gradient-to-r"
        backgroundGradient="from-green-50 via-white to-emerald-50"
      />

      <Footer />
    </div>
  );
};

export default StaffRecognitionPage;
