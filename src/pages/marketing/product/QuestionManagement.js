import React from 'react';
import { Helmet } from 'react-helmet';
import { MessageSquare, Edit3, Filter, Tag, Archive, Search } from 'lucide-react';
import Navbar from '../../../components/marketing/layout/Navbar';
import PageHeader from '../../../components/marketing/common/sections/PageHeader';
import ContentSplit from '../../../components/marketing/common/sections/ContentSplit';
import ProductFeaturesShowcase from '../../../components/marketing/common/sections/ProductFeaturesShowcase';
import FeatureGrid from '../../../components/marketing/common/sections/FeatureGrid';
import FAQSection from '../../../components/marketing/common/sections/FAQSection';
import CTA from '../../../components/marketing/common/sections/CTA';
import Footer from '../../../components/marketing/layout/Footer';

const QuestionManagementProduct = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Question Management | Chatters - Design Perfect Feedback Forms</title>
        <meta
          name="description"
          content="Create and customise feedback questions that get the insights you need. Chatters' question management system helps you design forms that customers actually complete."
        />
        <meta
          name="keywords"
          content="feedback questions, survey design, question management, feedback forms, customer surveys, feedback customization"
        />
        <meta property="og:title" content="Question Management | Chatters" />
        <meta property="og:description" content="Design perfect feedback forms with Chatters' flexible question management system." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/product/question-management" />
      </Helmet>

      {/* Overlay navbar sits above the hero */}
      <Navbar overlay />

      <PageHeader
        title="Question Management That Gets the Feedback You Actually Need"
        description="Design feedback forms that customers want to complete. Our flexible question system helps you gather specific, actionable insights while keeping surveys short and engaging."
        backgroundGradient="from-white to-teal-200"
        showSubtitle={true}
        subtitle="Question Management"
      />

      <ContentSplit
        eyebrow="Smart Question Design"
        eyebrowColour = "text-teal-600/80"
        title="Create feedback forms that customers actually complete."
        description="Our question builder helps you design surveys that are quick, relevant, and engaging. Get the insights you need without overwhelming your customers."
        bullets={[
          "Drag-and-drop question builder",
          "Pre-built question templates",
          "Conditional question logic",
          "Multi-language support"
        ]}
        primaryCta={{ label: "Try question builder", to: "/signup" }}
        secondaryCta={{ label: "See examples", to: "/demo" }}
        image={{ src: "/img/product_pages/questionmanagement/hero_img.svg", alt: "Question management interface" }}
      />

      <ProductFeaturesShowcase
        eyebrow="Question Intelligence"
        eyebrowColour = "text-teal-600/80" 
        title="Design surveys that drive action."
        description="Our question management system helps you create feedback forms that gather specific, actionable insights while maintaining high completion rates."
        primaryCta={{ label: "Start building questions", to: "/signup" }}
        secondaryCta={{ label: "View templates", to: "/demo" }}
        features={[
          {
            id: "builder",
            eyebrow: "Visual Builder",
            title: "Design questions visually",
            description: "Drag-and-drop interface makes it easy to create professional feedback forms without technical skills.",
            bullets: ["Visual editor", "Live preview", "Mobile optimisation"],
            image: { src: "/img/mock-builder.png", alt: "Question builder interface" },
          },
          {
            id: "logic",
            eyebrow: "Smart Logic",
            title: "Conditional question flows",
            description: "Show relevant follow-up questions based on previous answers to create personalised feedback experiences.",
            bullets: ["Branching logic", "Skip patterns", "Dynamic content"],
            image: { src: "/img/mock-logic.png", alt: "Conditional logic" },
          },
          {
            id: "templates",
            eyebrow: "Ready Templates",
            title: "Start with proven questions",
            description: "Choose from industry-tested question sets designed to maximise response rates and actionable insights.",
            bullets: ["Industry templates", "Best practices", "Custom branding"],
            image: { src: "/img/mock-templates.png", alt: "Question templates" },
          },
        ]}
      />


      <FeatureGrid
        eyebrow="Question Benefits"
        eyebrowColour='text-teal-600/80'
        title="Why teams love our question system"
        description="Smart question design leads to better feedback, higher completion rates, and more actionable insights for your business."
        gradientDirection="bg-gradient-to-b"
        backgroundGradient="from-white to-teal-50"
        dottedBackground={true}
        orbGlow
        cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
        items={[
          {
            icon: <MessageSquare className="w-6 h-6 text-teal-600" />,
            title: "Higher completion rates",
            description:
              "Well-designed questions keep customers engaged, leading to more completed feedback forms.",
          },
          {
            icon: <Edit3 className="w-6 h-6 text-teal-600" />,
            title: "Easy customization",
            description:
              "Modify questions, add your branding, and adjust forms without technical knowledge.",
          },
          {
            icon: <Filter className="w-6 h-6 text-teal-600" />,
            title: "Smart filtering",
            description:
              "Conditional logic shows relevant questions based on previous answers for personalised surveys.",
          },
          {
            icon: <Tag className="w-6 h-6 text-teal-600" />,
            title: "Category tagging",
            description:
              "Automatically categorise responses to route feedback to the right department or team member.",
          },
          {
            icon: <Archive className="w-6 h-6 text-teal-600" />,
            title: "Question library",
            description:
              "Save and reuse effective questions across different locations and feedback campaigns.",
          },
          {
            icon: <Search className="w-6 h-6 text-teal-600" />,
            title: "Response analytics",
            description:
              "See which questions generate the most useful feedback and optimise your forms over time.",
          },
        ]}
        wavyBottom={true}
      />

      <FAQSection
        eyebrow="Questions FAQ"
        eyebrowColour = "text-teal-600/80"
        title="Everything you need to know"
        description="If you have a different question, contact us and we'll help."
        dottedBackground
        orbGlow
        wavyBottom={false}
        backgroundGradient="from-white via-white to-teal-50"
        gradientDirection="bg-gradient-to-b"
        defaultOpenIndex={0}
        faqs={[
          { q: "How many questions can I add to a form?", a: "We recommend 3-5 questions for best completion rates, but you can add as many as needed. Our analytics show which length works best for your audience." },
          { q: "Can I use my own branding on the forms?", a: "Yes - customise colours, logos, fonts, and styling to match your brand perfectly." },
          { q: "Do you have pre-built question templates?", a: "We include proven question sets for restaurants, hotels, retail, and events. Each template is optimised for high completion rates." },
          { q: "Can questions change based on previous answers?", a: "Yes - use conditional logic to show relevant follow-up questions, creating personalised feedback experiences." },
        ]}
      />

      <CTA 
        title="Design feedback forms that actually get completed" 
        subtitle="Start your free trial and create engaging surveys that drive better customer insights."
        buttonText="Book a Demo"
        buttonLink="/demo"
        gradientDirection="bg-gradient-to-r"
        backgroundGradient="from-teal-50 via-white to-cyan-50"
      />


      <Footer />
    </div>
  );
};

export default QuestionManagementProduct;
