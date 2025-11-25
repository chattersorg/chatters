import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, ChevronRight, BookOpen, QrCode, HelpCircle, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/marketing/layout/Navbar';
import Footer from '../../components/marketing/layout/Footer';

const HelpPageNew = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Help content structure
  const helpContent = {
    'getting-started': {
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Everything you need to start collecting feedback',
      articles: [
        {
          id: 'account-setup',
          title: 'Setting Up Your Account',
          content: `
            <h3>Creating Your Chatters Account</h3>
            <p>Getting started with Chatters is quick and easy. Follow these steps to set up your account:</p>

            <h4>Step 1: Sign Up</h4>
            <ul>
              <li>Visit getchatters.com and click "Start Free Trial"</li>
              <li>Enter your email address and create a secure password</li>
              <li>Verify your email address by clicking the link we send you</li>
            </ul>

            <h4>Step 2: Create Your First Venue</h4>
            <ul>
              <li>Enter your venue name and address</li>
              <li>Specify the number of tables in your venue</li>
              <li>Upload your logo (optional but recommended)</li>
            </ul>

            <h4>Step 3: Configure Basic Settings</h4>
            <ul>
              <li>Set your feedback hours (when customers can submit feedback)</li>
              <li>Choose your brand colors to match your venue's style</li>
              <li>Add your team members if needed</li>
            </ul>

            <div class="tip-box">
              <strong>Pro Tip:</strong> Complete your venue setup before generating QR codes. This ensures your branding appears correctly on customer-facing forms.
            </div>

            <h4>Next Steps</h4>
            <p>Once your account is set up, you're ready to:</p>
            <ul>
              <li>Create your first feedback questions</li>
              <li>Generate and download QR codes</li>
              <li>Start collecting customer feedback</li>
            </ul>
          `
        },
        {
          id: 'first-questions',
          title: 'Creating Your First Questions',
          content: `
            <h3>Building Effective Feedback Questions</h3>
            <p>The questions you ask are crucial to getting valuable feedback. Here's how to create great questions:</p>

            <h4>Best Practices for Questions</h4>
            <ul>
              <li><strong>Keep it simple:</strong> Use clear, everyday language</li>
              <li><strong>Be specific:</strong> Ask about one aspect at a time</li>
              <li><strong>Stay brief:</strong> 3-5 questions is optimal</li>
              <li><strong>Focus on actionable areas:</strong> Food, service, atmosphere</li>
            </ul>

            <h4>Creating Questions</h4>
            <ol>
              <li>Go to Settings → Question Management</li>
              <li>Click "Add New Question"</li>
              <li>Type your question (e.g., "How was your food?")</li>
              <li>Click "Add Question" to save</li>
              <li>Repeat for 2-4 more questions</li>
            </ol>

            <h4>Example Questions by Industry</h4>

            <strong>Restaurants:</strong>
            <ul>
              <li>"How was your food quality?"</li>
              <li>"How was our service today?"</li>
              <li>"How was the atmosphere?"</li>
            </ul>

            <strong>Hotels:</strong>
            <ul>
              <li>"How was your check-in experience?"</li>
              <li>"How was your room?"</li>
              <li>"How was our staff service?"</li>
            </ul>

            <strong>Cafes:</strong>
            <ul>
              <li>"How was your coffee/tea?"</li>
              <li>"How was the speed of service?"</li>
              <li>"How was our atmosphere?"</li>
            </ul>

            <div class="warning-box">
              <strong>Avoid:</strong> Complex wording, technical jargon, or asking too many questions at once. Customers are more likely to complete short, simple surveys.
            </div>
          `
        },
        {
          id: 'team-setup',
          title: 'Adding Team Members',
          content: `
            <h3>Setting Up Your Team</h3>
            <p>Collaborate with your team by inviting them to your Chatters account.</p>

            <h4>User Roles Explained</h4>

            <strong>Admin:</strong>
            <ul>
              <li>Full access to all venues and settings</li>
              <li>Can manage billing and subscriptions</li>
              <li>Can add/remove team members</li>
              <li>Access to all reports and analytics</li>
            </ul>

            <strong>Manager:</strong>
            <ul>
              <li>Access to assigned venues only</li>
              <li>Can manage feedback and questions</li>
              <li>Can customise branding and settings</li>
              <li>Cannot access billing information</li>
            </ul>

            <strong>Staff:</strong>
            <ul>
              <li>Kiosk mode access only</li>
              <li>Can view and resolve feedback</li>
              <li>Can respond to assistance requests</li>
              <li>Cannot change venue settings</li>
            </ul>

            <h4>How to Invite Team Members</h4>
            <ol>
              <li>Navigate to Settings → Staff Management</li>
              <li>Click "Invite User"</li>
              <li>Enter their email address</li>
              <li>Select their role (Admin/Manager/Staff)</li>
              <li>Choose which venues they can access</li>
              <li>Click "Send Invitation"</li>
            </ol>

            <p>They'll receive an email with instructions to create their password and log in.</p>

            <div class="tip-box">
              <strong>Security Tip:</strong> Always use the principle of least privilege - give team members the minimum access they need to do their job.
            </div>
          `
        },
        {
          id: 'testing-system',
          title: 'Testing Your Feedback System',
          content: `
            <h3>Testing Before Going Live</h3>
            <p>Before placing QR codes for customers, it's important to test your system thoroughly.</p>

            <h4>Testing Checklist</h4>

            <strong>1. Test the Customer Experience:</strong>
            <ul>
              <li>Scan your QR code with a mobile phone</li>
              <li>Submit test feedback for different ratings (1 star, 3 stars, 5 stars)</li>
              <li>Try the "Just need assistance?" button</li>
              <li>Leave optional comments</li>
            </ul>

            <strong>2. Test the Kiosk Dashboard:</strong>
            <ul>
              <li>Open kiosk mode on a tablet or computer</li>
              <li>Verify alerts appear for test feedback</li>
              <li>Practice resolving feedback items</li>
              <li>Check that color coding works correctly</li>
            </ul>

            <strong>3. Test Your Branding:</strong>
            <ul>
              <li>Verify your logo appears correctly</li>
              <li>Check that colors match your brand</li>
              <li>Ensure text is readable</li>
              <li>Test on different phone sizes</li>
            </ul>

            <strong>4. Test Team Access:</strong>
            <ul>
              <li>Have team members log in</li>
              <li>Verify they can see appropriate venues</li>
              <li>Test that permissions work correctly</li>
            </ul>

            <h4>Common Testing Issues</h4>
            <p><strong>QR code not scanning:</strong> Ensure the code is at least 2cm x 2cm and printed clearly.</p>
            <p><strong>Branding not appearing:</strong> Clear your browser cache and refresh the page.</p>
            <p><strong>Team can't access:</strong> Check they've verified their email and been assigned to the correct venue.</p>

            <div class="tip-box">
              <strong>Best Practice:</strong> Test with at least 5-10 sample submissions to ensure everything works smoothly before going live.
            </div>
          `
        }
      ]
    },
    'qr-codes': {
      title: 'QR Codes',
      icon: QrCode,
      description: 'Generate, customise, and deploy QR codes',
      articles: [
        {
          id: 'generating-qr',
          title: 'Generating QR Codes',
          content: `
            <h3>Creating Your QR Codes</h3>
            <p>QR codes are how customers access your feedback forms. Here's how to generate them:</p>

            <h4>Generating a QR Code</h4>
            <ol>
              <li>Log in to your Chatters dashboard</li>
              <li>Go to Settings → QR Codes</li>
              <li>Select the venue you want to create codes for</li>
              <li>Click "Generate QR Code"</li>
              <li>Choose your preferred size and format</li>
              <li>Click "Download"</li>
            </ol>

            <h4>QR Code Types</h4>

            <strong>Standard QR Code:</strong>
            <p>Links directly to your feedback form. Best for table tents, receipts, and general use.</p>

            <strong>Table-Specific QR Codes:</strong>
            <p>Each code is pre-assigned to a specific table number. Best for permanent installations.</p>

            <h4>Download Formats</h4>
            <ul>
              <li><strong>PNG:</strong> Best for digital displays and screens</li>
              <li><strong>SVG:</strong> Best for large prints (scales without quality loss)</li>
              <li><strong>PDF:</strong> Best for printing multiple codes at once</li>
            </ul>

            <div class="tip-box">
              <strong>Pro Tip:</strong> Generate multiple sizes if you're placing QR codes in different locations (small for receipts, large for wall displays).
            </div>

            <h4>Regenerating QR Codes</h4>
            <p>If you need to regenerate your QR codes:</p>
            <ul>
              <li>Old codes will continue to work (they don't expire)</li>
              <li>Use this if you lose your original files</li>
              <li>The URL remains the same</li>
            </ul>
          `
        },
        {
          id: 'customising-qr',
          title: 'Customising QR Code Appearance',
          content: `
            <h3>Making Your QR Codes On-Brand</h3>
            <p>Customise your QR codes to match your venue's aesthetic.</p>

            <h4>Customisation Options</h4>

            <strong>Adding Your Logo:</strong>
            <ul>
              <li>Upload your logo in Settings → Branding</li>
              <li>Your logo will appear in the center of QR codes</li>
              <li>Recommended size: 200x200 pixels</li>
              <li>Format: PNG with transparent background works best</li>
            </ul>

            <strong>Colour Customisation:</strong>
            <ul>
              <li>Change QR code colours to match your brand</li>
              <li>Maintain good contrast for scanability</li>
              <li>Dark colours on light backgrounds work best</li>
            </ul>

            <strong>Adding Instructions:</strong>
            <ul>
              <li>Include text like "Scan for feedback"</li>
              <li>Add your venue name</li>
              <li>Provide simple instructions</li>
            </ul>

            <h4>Design Best Practices</h4>
            <ul>
              <li><strong>Keep it simple:</strong> Don't overcomplicate the design</li>
              <li><strong>Maintain contrast:</strong> Dark on light or light on dark</li>
              <li><strong>Test scanability:</strong> Always test before mass printing</li>
              <li><strong>Size appropriately:</strong> Minimum 2cm x 2cm</li>
            </ul>

            <div class="warning-box">
              <strong>Warning:</strong> Excessive customisation can affect scanability. Always test your customised QR codes before printing large quantities.
            </div>
          `
        },
        {
          id: 'placement-strategies',
          title: 'QR Code Placement Strategies',
          content: `
            <h3>Where to Place Your QR Codes</h3>
            <p>Strategic placement is key to maximising feedback collection.</p>

            <h4>Best Locations</h4>

            <strong>On Tables:</strong>
            <ul>
              <li>Table tents (most common and effective)</li>
              <li>Laminated cards placed with menus</li>
              <li>Built into table displays or holders</li>
              <li><strong>Advantage:</strong> Customers see it throughout their visit</li>
            </ul>

            <strong>On Receipts:</strong>
            <ul>
              <li>Print at the bottom of bills/receipts</li>
              <li>Add a call-to-action message</li>
              <li><strong>Advantage:</strong> Reaches every customer automatically</li>
            </ul>

            <strong>Wall Displays:</strong>
            <ul>
              <li>Near exits or restrooms</li>
              <li>At the host stand or reception desk</li>
              <li>In waiting areas</li>
              <li><strong>Advantage:</strong> Catches customers as they leave</li>
            </ul>

            <strong>Digital Displays:</strong>
            <ul>
              <li>On tablets at checkout</li>
              <li>On TV screens or digital menus</li>
              <li><strong>Advantage:</strong> Easy to update and change</li>
            </ul>

            <h4>Placement Tips</h4>
            <ul>
              <li><strong>Eye level:</strong> Place at natural eye level when seated or standing</li>
              <li><strong>Good lighting:</strong> Avoid dark corners or harsh shadows</li>
              <li><strong>Protected:</strong> Use lamination or protective covers</li>
              <li><strong>Multiple locations:</strong> More visibility = more feedback</li>
            </ul>

            <h4>What to Avoid</h4>
            <ul>
              <li>Placing where they can get wet or dirty</li>
              <li>Making them too small to scan easily</li>
              <li>Hiding them behind menus or other items</li>
              <li>Placing in areas with poor lighting</li>
            </ul>

            <div class="tip-box">
              <strong>Pro Tip:</strong> Test different placements for a week and track which locations generate the most feedback. Double down on what works!
            </div>
          `
        },
        {
          id: 'qr-best-practices',
          title: 'QR Code Best Practices',
          content: `
            <h3>Maximising QR Code Effectiveness</h3>
            <p>Follow these best practices to ensure your QR codes work flawlessly.</p>

            <h4>Technical Best Practices</h4>

            <strong>Size Requirements:</strong>
            <ul>
              <li><strong>Minimum size:</strong> 2cm x 2cm (about 0.8 inches)</li>
              <li><strong>Recommended:</strong> 3-5cm x 3-5cm for table placement</li>
              <li><strong>Large displays:</strong> 10cm+ for wall posters</li>
              <li><strong>Rule of thumb:</strong> Scanning distance = 10x the QR code size</li>
            </ul>

            <strong>Print Quality:</strong>
            <ul>
              <li>Use high-resolution images (minimum 300 DPI)</li>
              <li>Print on quality paper or card stock</li>
              <li>Laminate for durability</li>
              <li>Avoid pixelation or blurriness</li>
            </ul>

            <strong>Environmental Factors:</strong>
            <ul>
              <li>Ensure good lighting conditions</li>
              <li>Avoid reflective surfaces that cause glare</li>
              <li>Protect from spills with lamination</li>
              <li>Keep flat - avoid wrinkles or folds</li>
            </ul>

            <h4>Customer Experience Best Practices</h4>

            <strong>Clear Instructions:</strong>
            <ul>
              <li>"Scan to leave feedback"</li>
              <li>"Share your experience"</li>
              <li>"Tell us how we did"</li>
            </ul>

            <strong>Timing Matters:</strong>
            <ul>
              <li>Place where customers will be near end of visit</li>
              <li>Don't interrupt their dining experience too early</li>
              <li>Make it available but not intrusive</li>
            </ul>

            <strong>Staff Training:</strong>
            <ul>
              <li>Train staff to mention the feedback option</li>
              <li>"We'd love your feedback - just scan the QR code"</li>
              <li>Don't pressure customers, just inform them</li>
            </ul>

            <h4>Troubleshooting</h4>
            <p><strong>If QR code won't scan:</strong></p>
            <ul>
              <li>Check that it's not too small</li>
              <li>Ensure adequate lighting</li>
              <li>Verify the print quality is sharp</li>
              <li>Try cleaning camera lens</li>
              <li>Test with multiple phones</li>
            </ul>

            <div class="tip-box">
              <strong>Testing Protocol:</strong> Before deploying new QR codes, test them with at least 3 different phone models in the actual placement location.
            </div>
          `
        }
      ]
    },
    'question-management': {
      title: 'Question Management',
      icon: HelpCircle,
      description: 'Create, edit, and optimise your feedback questions',
      articles: [
        {
          id: 'adding-questions',
          title: 'Adding New Questions',
          content: `
            <h3>Creating Effective Questions</h3>
            <p>Your questions determine the quality of feedback you receive.</p>

            <h4>How to Add Questions</h4>
            <ol>
              <li>Navigate to Settings → Question Management</li>
              <li>Click "Add New Question" or use the text input field</li>
              <li>Type your question clearly and concisely</li>
              <li>Click "Add Question" to save</li>
              <li>Your question immediately becomes active</li>
            </ol>

            <h4>Question Limits</h4>
            <ul>
              <li><strong>Maximum questions:</strong> 5 active questions at once</li>
              <li><strong>Recommended:</strong> 3-4 questions for best completion rates</li>
              <li><strong>Minimum:</strong> At least 2 questions</li>
            </ul>

            <h4>Writing Great Questions</h4>

            <strong>Do's:</strong>
            <ul>
              <li>✅ Use simple, everyday language</li>
              <li>✅ Ask about one specific aspect</li>
              <li>✅ Keep questions short (under 10 words)</li>
              <li>✅ Focus on actionable areas</li>
              <li>✅ Use "How was..." format</li>
            </ul>

            <strong>Don'ts:</strong>
            <ul>
              <li>❌ Use complex or technical language</li>
              <li>❌ Ask multiple things in one question</li>
              <li>❌ Make questions too long or wordy</li>
              <li>❌ Ask leading questions</li>
              <li>❌ Use industry jargon</li>
            </ul>

            <h4>Example Questions</h4>

            <strong>Good Examples:</strong>
            <ul>
              <li>"How was your food?" ✅</li>
              <li>"How was our service?" ✅</li>
              <li>"How was the atmosphere?" ✅</li>
              <li>"How was the cleanliness?" ✅</li>
            </ul>

            <strong>Poor Examples:</strong>
            <ul>
              <li>"Please rate the overall culinary experience and ambiance" ❌ (too complex)</li>
              <li>"Was everything perfect?" ❌ (leading question)</li>
              <li>"How were the food and service?" ❌ (multiple aspects)</li>
            </ul>

            <div class="tip-box">
              <strong>Pro Tip:</strong> Use Chatters' suggested questions as inspiration. They're based on thousands of successful feedback forms across different industries.
            </div>
          `
        },
        {
          id: 'editing-questions',
          title: 'Editing Existing Questions',
          content: `
            <h3>Modifying Your Questions</h3>
            <p>Learn how to update and improve your existing questions.</p>

            <h4>How to Edit Questions</h4>
            <ol>
              <li>Go to Settings → Question Management</li>
              <li>Find the question you want to edit in the "Current Questions" list</li>
              <li>Click the pencil/edit icon next to the question</li>
              <li>Make your changes to the question text</li>
              <li>Click the checkmark to save or X to cancel</li>
            </ol>

            <h4>What Happens When You Edit</h4>
            <ul>
              <li>The question updates immediately for new feedback submissions</li>
              <li>Historical data remains unchanged</li>
              <li>Analytics will show the new question text going forward</li>
              <li>No disruption to active feedback sessions</li>
            </ul>

            <h4>When to Edit Questions</h4>

            <strong>Good Reasons to Edit:</strong>
            <ul>
              <li>Fixing typos or grammatical errors</li>
              <li>Simplifying complex wording</li>
              <li>Making questions more specific</li>
              <li>Adjusting based on customer feedback</li>
              <li>Seasonal changes (e.g., outdoor seating in summer)</li>
            </ul>

            <strong>Consider Creating New Instead:</strong>
            <ul>
              <li>If you're changing the core meaning significantly</li>
              <li>If you want to track performance separately</li>
              <li>If you're testing different question formats</li>
            </ul>

            <h4>Best Practices</h4>
            <ul>
              <li><strong>Test before committing:</strong> Preview how the edited question looks</li>
              <li><strong>Keep track:</strong> Note what you changed and when</li>
              <li><strong>Monitor impact:</strong> Check if response rates change</li>
              <li><strong>Don't over-edit:</strong> Constant changes can confuse analytics</li>
            </ul>

            <div class="warning-box">
              <strong>Important:</strong> Major question changes can affect your historical data analysis. Consider the impact before making significant edits.
            </div>
          `
        },
        {
          id: 'archiving-questions',
          title: 'Archiving and Reactivating Questions',
          content: `
            <h3>Managing Your Question Archive</h3>
            <p>Learn how to archive questions you're not currently using and bring them back when needed.</p>

            <h4>What is the Question Archive?</h4>
            <p>The archive is a storage area for questions you're not currently using but may want to use again later. Archived questions:</p>
            <ul>
              <li>Don't appear on customer feedback forms</li>
              <li>Are hidden from your active question list</li>
              <li>Can be reactivated at any time</li>
              <li>Preserve their historical data</li>
            </ul>

            <h4>How to Archive a Question</h4>
            <ol>
              <li>Go to Settings → Question Management</li>
              <li>Find the question in your "Current Questions" list</li>
              <li>Click the trash/delete icon next to the question</li>
              <li>Confirm you want to archive it</li>
              <li>The question moves to the archive immediately</li>
            </ol>

            <h4>How to Reactivate Archived Questions</h4>
            <ol>
              <li>Go to Settings → Question Management</li>
              <li>Click on "Question Archive" to expand it</li>
              <li>Browse your archived questions</li>
              <li>Click the reactivate icon (circular arrow) next to the question</li>
              <li>If you have 5 active questions, choose which one to replace</li>
            </ol>

            <h4>When to Archive Questions</h4>

            <strong>Good Times to Archive:</strong>
            <ul>
              <li>Seasonal questions (e.g., "outdoor seating" in winter)</li>
              <li>Questions about discontinued menu items</li>
              <li>Rotating focus areas month-to-month</li>
              <li>Testing new questions temporarily</li>
              <li>Special event or promotion questions</li>
            </ul>

            <h4>Archive Management Tips</h4>
            <ul>
              <li><strong>Use search:</strong> Find archived questions quickly with the search bar</li>
              <li><strong>Clean regularly:</strong> Review archive quarterly to remove truly obsolete questions</li>
              <li><strong>Name clearly:</strong> Use descriptive question text so you remember what each was for</li>
              <li><strong>Track performance:</strong> Before archiving, note how well the question performed</li>
            </ul>

            <div class="tip-box">
              <strong>Strategy:</strong> Create seasonal question sets and rotate them in/out of the archive. For example, "How was our patio experience?" active in summer, archived in winter.
            </div>

            <h4>Finding Archived Questions</h4>
            <p>The archive shows:</p>
            <ul>
              <li>All questions you've previously removed</li>
              <li>Questions are filtered to hide duplicates of currently active ones</li>
              <li>Search functionality to find specific questions</li>
              <li>One-click reactivation</li>
            </ul>
          `
        },
        {
          id: 'question-analytics',
          title: 'Analysing Question Performance',
          content: `
            <h3>Understanding Question Analytics</h3>
            <p>Learn how to track and optimise your questions based on performance data.</p>

            <h4>Key Metrics to Track</h4>

            <strong>Average Rating per Question:</strong>
            <ul>
              <li>See which aspects of your business score highest/lowest</li>
              <li>Identify areas needing improvement</li>
              <li>Track improvements over time</li>
            </ul>

            <strong>Response Rate:</strong>
            <ul>
              <li>How many customers answer each question</li>
              <li>Lower rates may indicate confusing questions</li>
              <li>Helps identify question fatigue</li>
            </ul>

            <strong>Comment Frequency:</strong>
            <ul>
              <li>Which questions generate the most written feedback</li>
              <li>Indicates what customers care about most</li>
              <li>Valuable for detailed insights</li>
            </ul>

            <h4>How to Access Question Analytics</h4>
            <ol>
              <li>Go to Dashboard → Analytics</li>
              <li>Select your date range</li>
              <li>View the "Question Breakdown" section</li>
              <li>Compare performance across questions</li>
            </ol>

            <h4>Optimising Based on Data</h4>

            <strong>Low Response Rate:</strong>
            <ul>
              <li><strong>Problem:</strong> Question may be confusing or too complex</li>
              <li><strong>Solution:</strong> Simplify the wording or make it more specific</li>
            </ul>

            <strong>Consistently Low Ratings:</strong>
            <ul>
              <li><strong>Problem:</strong> Real issue with that aspect of service</li>
              <li><strong>Solution:</strong> Focus operational improvements on this area</li>
            </ul>

            <strong>No Written Comments:</strong>
            <ul>
              <li><strong>Problem:</strong> Question may be too vague</li>
              <li><strong>Solution:</strong> Ask more specific follow-ups</li>
            </ul>

            <strong>High Ratings, Many Comments:</strong>
            <ul>
              <li><strong>Insight:</strong> This is a key differentiator for your business</li>
              <li><strong>Action:</strong> Maintain standards and emphasise in marketing</li>
            </ul>

            <h4>A/B Testing Questions</h4>
            <p>Test different question formats to see what works best:</p>
            <ol>
              <li>Run one version of a question for 2 weeks</li>
              <li>Note the response rate and average rating</li>
              <li>Switch to an alternative version</li>
              <li>Compare results after 2 weeks</li>
              <li>Keep the better-performing version</li>
            </ol>

            <div class="tip-box">
              <strong>Pro Tip:</strong> Review your question analytics monthly. Small tweaks to underperforming questions can dramatically improve the quality of feedback you receive.
            </div>

            <h4>Benchmarking</h4>
            <p>Compare your question performance to:</p>
            <ul>
              <li>Your own historical data (month over month)</li>
              <li>Different locations (if you have multiple venues)</li>
              <li>Different times (lunch vs. dinner service)</li>
            </ul>
          `
        }
      ]
    }
  };

  // Search functionality
  const searchArticles = () => {
    if (!searchTerm) return null;

    const results = [];
    Object.keys(helpContent).forEach(categoryKey => {
      const category = helpContent[categoryKey];
      category.articles.forEach(article => {
        const matchTitle = article.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchContent = article.content.toLowerCase().includes(searchTerm.toLowerCase());

        if (matchTitle || matchContent) {
          results.push({
            ...article,
            categoryTitle: category.title,
            categoryKey: categoryKey
          });
        }
      });
    });

    return results;
  };

  const searchResults = searchTerm ? searchArticles() : null;

  // View handlers
  const handleCategoryClick = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setSelectedArticle(null);
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedArticle(null);
  };

  const handleBackToArticleList = () => {
    setSelectedArticle(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Help Center | Chatters</title>
        <meta name="description" content="Get help with Chatters - customer feedback platform for hospitality" />
      </Helmet>

      <Navbar overlay={false} />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-green-600 to-green-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-satoshi">How can we help you?</h1>
          <p className="text-xl text-green-100 mb-8 font-satoshi">Search our help center or browse articles below</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-green-300 font-satoshi"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Results */}
        {searchResults && searchResults.length > 0 ? (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setSearchTerm('')}
                className="flex items-center text-green-600 hover:text-green-700 font-medium font-satoshi"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Clear search
              </button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-satoshi">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
            </h2>
            <div className="grid gap-4">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedCategory(result.categoryKey);
                    handleArticleClick(result);
                    setSearchTerm('');
                  }}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                >
                  <div className="text-sm text-green-600 font-medium mb-2 font-satoshi">{result.categoryTitle}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 font-satoshi">{result.title}</h3>
                  <div className="flex items-center text-gray-600 font-satoshi">
                    <span className="text-sm">Read article</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searchResults && searchResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-satoshi">No results found</h3>
            <p className="text-gray-600 font-satoshi">Try different search terms or browse the categories below</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-green-600 hover:text-green-700 font-medium font-satoshi"
            >
              Clear search
            </button>
          </div>
        ) : selectedArticle ? (
          /* Article View */
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToArticleList}
                className="flex items-center text-green-600 hover:text-green-700 font-medium mb-4 font-satoshi"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {helpContent[selectedCategory].title}
              </button>
              <h1 className="text-4xl font-bold text-gray-900 font-satoshi">{selectedArticle.title}</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div
                className="prose prose-lg max-w-none font-satoshi"
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                style={{
                  fontFamily: 'Satoshi, sans-serif'
                }}
              />
            </div>

            {/* Related Articles */}
            <div className="mt-12">
              <h3 className="text-xl font-bold text-gray-900 mb-4 font-satoshi">More articles in {helpContent[selectedCategory].title}</h3>
              <div className="grid gap-4">
                {helpContent[selectedCategory].articles
                  .filter(a => a.id !== selectedArticle.id)
                  .map((article, index) => (
                    <div
                      key={index}
                      onClick={() => handleArticleClick(article)}
                      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-900 font-satoshi">{article.title}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : selectedCategory ? (
          /* Article List View */
          <div>
            <div className="mb-8">
              <button
                onClick={handleBackToCategories}
                className="flex items-center text-green-600 hover:text-green-700 font-medium mb-4 font-satoshi"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to all categories
              </button>
              <div className="flex items-center mb-4">
                {React.createElement(helpContent[selectedCategory].icon, { className: "w-10 h-10 text-green-600 mr-4" })}
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 font-satoshi">{helpContent[selectedCategory].title}</h1>
                  <p className="text-gray-600 text-lg mt-2 font-satoshi">{helpContent[selectedCategory].description}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {helpContent[selectedCategory].articles.map((article, index) => (
                <div
                  key={index}
                  onClick={() => handleArticleClick(article)}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors font-satoshi">
                        {article.title}
                      </h3>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Category Grid View */
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 font-satoshi">Browse by category</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.keys(helpContent).map((categoryKey) => {
                const category = helpContent[categoryKey];
                const Icon = category.icon;
                return (
                  <div
                    key={categoryKey}
                    onClick={() => handleCategoryClick(categoryKey)}
                    className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group"
                  >
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                      <Icon className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-satoshi">{category.title}</h3>
                    <p className="text-gray-600 mb-4 font-satoshi">{category.description}</p>
                    <div className="flex items-center text-green-600 font-medium font-satoshi">
                      <span>{category.articles.length} articles</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Custom Styles for Article Content */}
      <style jsx global>{`
        .prose h3 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-family: 'Satoshi', sans-serif;
        }

        .prose h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-family: 'Satoshi', sans-serif;
        }

        .prose h5 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #4B5563;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-family: 'Satoshi', sans-serif;
        }

        .prose p {
          margin-bottom: 1rem;
          line-height: 1.75;
          color: #4B5563;
          font-family: 'Satoshi', sans-serif;
        }

        .prose ul, .prose ol {
          margin-bottom: 1rem;
          margin-left: 1.5rem;
          font-family: 'Satoshi', sans-serif;
        }

        .prose li {
          margin-bottom: 0.5rem;
          color: #4B5563;
          line-height: 1.75;
        }

        .prose strong {
          font-weight: 600;
          color: #111827;
        }

        .prose .tip-box {
          background-color: #ECFDF5;
          border-left: 4px solid #10B981;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
        }

        .prose .warning-box {
          background-color: #FEF3C7;
          border-left: 4px solid #F59E0B;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default HelpPageNew;
