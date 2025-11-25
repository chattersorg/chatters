import React from 'react';
import { Helmet } from 'react-helmet';
import { Trophy, Medal, Users, TrendingUp, Star, Target } from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import PageHeader from '../../../components/marketing/common/sections/PageHeader';
import ContentSplit from '../../../components/marketing/common/sections/ContentSplit';
import ProductFeaturesShowcase from '../../../components/marketing/common/sections/ProductFeaturesShowcase';
import FeatureGrid from '../../../components/marketing/common/sections/FeatureGrid';
import FAQSection from '../../../components/marketing/common/sections/FAQSection';
import CTA from '../../../components/marketing/common/sections/CTA';
import Footer from '../../../components/marketing/layout/Footer';

const StaffLeaderboardPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Staff Leaderboard | Chatters - Motivate Your Team with Performance Recognition</title>
        <meta
          name="description"
          content="Boost team morale and performance with gamified staff leaderboards. Track achievements, celebrate success, and motivate your team to deliver exceptional customer service."
        />
        <meta
          name="keywords"
          content="staff leaderboard, team performance, employee recognition, gamification, staff motivation, performance tracking, team competition"
        />
        <meta property="og:title" content="Staff Leaderboard | Chatters" />
        <meta property="og:description" content="Motivate your team with gamified performance tracking and recognition through interactive staff leaderboards." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/staff-leaderboard" />
      </Helmet>

      {/* Overlay navbar sits above the hero */}
      <Navbar overlay />

      <PageHeader
        title="Motivate Your Team With Performance Leaderboards That Celebrate Success"
        description="Turn customer service into a friendly competition. Track achievements, recognise top performers, and boost team morale with gamified performance tracking."
        backgroundGradient="from-white to-yellow-200"
        showSubtitle={true}
        subtitle="Staff Leaderboard"
      />

      <ContentSplit
        eyebrow="Team Motivation"
        eyebrowColour='text-yellow-600'
        title="Transform performance tracking into team motivation."
        description="Create a culture of excellence with interactive leaderboards that showcase individual and team achievements. Celebrate success and inspire continuous improvement."
        bullets={[
          "Real-time performance tracking",
          "Customisable achievement badges", 
          "Team and individual rankings",
          "Automated recognition system"
        ]}
        primaryCta={{ label: "Start motivating", to: "/signup" }}
        secondaryCta={{ label: "See demo", to: "/demo" }}
        image={{ src: "/img/product_pages/staffleaderboard/hero.png", alt: "Staff leaderboard interface" }}
      />

      <ProductFeaturesShowcase
        eyebrow="Performance Recognition"
        eyebrowColour='text-yellow-600'
        title="Gamify performance to drive excellence."
        description="Build engaging leaderboards that track meaningful metrics, celebrate achievements, and create healthy competition among your team members."
        primaryCta={{ label: "Try leaderboards", to: "/signup" }}
        secondaryCta={{ label: "View examples", to: "/demo" }}
        features={[
          {
            id: "tracking",
            eyebrow: "Performance Metrics",
            title: "Track what matters most",
            description: "Monitor customer satisfaction scores, response times, resolution rates, and custom KPIs that align with your business goals.",
            bullets: ["Custom metric tracking", "Real-time updates", "Historical performance"],
            image: { src: "/img/mock-metrics.png", alt: "Performance tracking dashboard" },
          },
          {
            id: "recognition",
            eyebrow: "Achievement System",
            title: "Celebrate wins with badges & rewards",
            description: "Automatically recognise achievements with customisable badges, milestone celebrations, and reward systems that motivate continued excellence.",
            bullets: ["Achievement badges", "Milestone rewards", "Custom recognition"],
            image: { src: "/img/mock-badges.png", alt: "Achievement badges and rewards" },
          },
          {
            id: "competition",
            eyebrow: "Team Competition",
            title: "Healthy competition drives results",
            description: "Create team competitions, department rankings, and individual challenges that foster collaboration while driving performance improvements.",
            bullets: ["Team competitions", "Department rankings", "Individual challenges"],
            image: { src: "/img/mock-competition.png", alt: "Team competition interface" },
          },
        ]}
      />

      <FeatureGrid
        eyebrow="Leaderboard Benefits"
        eyebrowColour='text-yellow-600'
        title="Why teams love performance leaderboards"
        description="Boost engagement, improve performance, and create a positive work culture with gamified recognition systems."
        gradientDirection="bg-gradient-to-b"
        backgroundGradient="from-white to-yellow-50"
        dottedBackground={true}
        orbGlow
        cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
        items={[
          {
            icon: <Trophy className="w-6 h-6 text-yellow-600" />,
            title: "Performance motivation",
            description:
              "Leaderboards create healthy competition that motivates staff to consistently deliver exceptional customer service.",
          },
          {
            icon: <Medal className="w-6 h-6 text-yellow-600" />,
            title: "Achievement recognition",
            description:
              "Automatically celebrate milestones and achievements with badges, notifications, and public recognition displays.",
          },
          {
            icon: <Users className="w-6 h-6 text-yellow-600" />,
            title: "Team collaboration",
            description:
              "Foster teamwork with group challenges and department competitions that encourage collaboration and peer support.",
          },
          {
            icon: <TrendingUp className="w-6 h-6 text-yellow-600" />,
            title: "Performance insights",
            description:
              "Gain valuable insights into individual and team performance trends to identify training opportunities and top performers.",
          },
          {
            icon: <Star className="w-6 h-6 text-yellow-600" />,
            title: "Employee engagement",
            description:
              "Increase job satisfaction and engagement by making performance tracking fun, transparent, and rewarding for everyone.",
          },
          {
            icon: <Target className="w-6 h-6 text-yellow-600" />,
            title: "Goal achievement",
            description:
              "Set and track progress toward individual and team goals with visual progress indicators and milestone celebrations.",
          },
        ]}
        wavyBottom={true}
      />

      <FAQSection
        eyebrow="Leaderboard FAQ"
        eyebrowColour='text-yellow-600'
        title="Everything you need to know"
        description="If you have a different question, contact us and we'll help."
        dottedBackground
        orbGlow
        wavyBottom={false}
        backgroundGradient="from-white via-white to-yellow-50"
        gradientDirection="bg-gradient-to-b"
        defaultOpenIndex={0}
        faqs={[
          { q: "What metrics can be tracked on the leaderboard?", a: "Track any performance metric that matters to your business - customer satisfaction scores, response times, resolution rates, upsells, positive reviews, and custom KPIs you define." },
          { q: "Can I customise the recognition system?", a: "Yes - create custom badges, set your own achievement milestones, and design rewards that align with your company culture and values." },
          { q: "How do team competitions work?", a: "Set up competitions between departments, shifts, or custom groups. Define the competition period, metrics, and rewards to create engaging team challenges." },
          { q: "Is the leaderboard visible to all staff?", a: "You control visibility - make leaderboards public for motivation, private for management review, or create different views for different roles and teams." },
        ]}
      />

      <CTA 
        title="Motivate your team with performance leaderboards" 
        subtitle="Start your free trial and create engaging leaderboards that celebrate success and drive exceptional customer service."
        buttonText="Book a Demo"
        buttonLink="/demo"
        gradientDirection="bg-gradient-to-r"
        backgroundGradient="from-yellow-50 via-white to-orange-50"
      />

      <Footer />
    </div>
  );
};

export default StaffLeaderboardPage;