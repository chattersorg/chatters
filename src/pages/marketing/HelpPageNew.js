import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  ChevronDown,
  BookOpen,
  QrCode,
  HelpCircle,
  ArrowLeft,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Shield,
  Wrench,
  MessageSquare,
  Palette,
  Monitor
} from 'lucide-react';
import Navbar from '../../components/marketing/layout/Navbar';
import Footer from '../../components/marketing/layout/Footer';

const HelpPageNew = () => {
  const { categorySlug, articleSlug } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Help content structure - Zendesk style with categories and articles
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
            <h3>Getting Started with Chatters</h3>
            <p>Once your account has been created by our team, follow these steps to get set up:</p>

            <h4>Step 1: Upload Your Logo</h4>
            <ul>
              <li>Go to <strong>Settings > Branding</strong> in the sidebar</li>
              <li>Upload your venue logo (PNG or JPG recommended)</li>
              <li>This will appear on your feedback forms and QR codes</li>
            </ul>

            <h4>Step 2: Configure Basic Settings</h4>
            <ul>
              <li>Set your feedback hours in <strong>Feedback > Settings</strong> (when customers can submit feedback)</li>
              <li>Choose your brand colours in <strong>Settings > Branding</strong> to match your venue's style</li>
              <li>Add your team members in <strong>Staff > Team</strong> if needed</li>
            </ul>

            <h4>Step 3: Create Your Questions</h4>
            <ul>
              <li>Go to <strong>Feedback > Questions</strong></li>
              <li>Add questions that are relevant to your venue</li>
              <li>We recommend 3-5 short, simple questions</li>
            </ul>

            <div class="tip-box">
              <strong>Pro Tip:</strong> Complete your venue setup before generating QR codes. This ensures your branding appears correctly on customer-facing forms.
            </div>

            <h4>Next Steps</h4>
            <p>Once your account is set up, you're ready to:</p>
            <ul>
              <li>Generate and download QR codes from <strong>Settings > QR Code</strong></li>
              <li>Start collecting customer feedback</li>
              <li>View responses in <strong>Feedback > All Feedback</strong></li>
            </ul>
          `
        },
        {
          id: 'adding-venues',
          title: 'Adding Venues',
          content: `
            <h3>Adding New Venues to Your Account</h3>
            <p>Chatters supports multiple venues under a single account. Here's how to add new venues:</p>

            <h4>How to Add a Venue</h4>
            <ol>
              <li>Navigate to <strong>Multi Venue > Venues</strong> in the sidebar</li>
              <li>Click "Add New Venue"</li>
              <li>Enter the venue details:
                <ul>
                  <li>Venue name</li>
                  <li>Address</li>
                  <li>Number of tables/locations</li>
                </ul>
              </li>
              <li>Upload venue-specific branding (optional)</li>
              <li>Click "Create Venue"</li>
            </ol>

            <h4>Venue Settings</h4>
            <p>Each venue can have its own:</p>
            <ul>
              <li>Branding and colours (<strong>Settings > Branding</strong>)</li>
              <li>Feedback questions (<strong>Feedback > Questions</strong>)</li>
              <li>QR codes (<strong>Settings > QR Code</strong>)</li>
              <li>Team members (<strong>Staff > Team</strong>)</li>
              <li>Feedback settings (<strong>Feedback > Settings</strong>)</li>
            </ul>

            <div class="tip-box">
              <strong>Multi-Venue Tip:</strong> Use the venue switcher at the top of the sidebar to quickly switch between venues in your dashboard.
            </div>
          `
        },
        {
          id: 'roles-locations',
          title: 'Employee Roles & Locations',
          content: `
            <h3>Organising Your Employees</h3>
            <p>Chatters uses roles and locations to categorise your employees, making it easier to track feedback and performance by team or area.</p>

            <h4>Employee Roles</h4>
            <p>Roles are job titles that describe what your employees do. Go to <strong>Staff > Roles</strong> to create and manage roles for your venue:</p>
            <ul>
              <li>Server</li>
              <li>Bartender</li>
              <li>Host/Hostess</li>
              <li>Chef</li>
              <li>Kitchen Assistant</li>
              <li>Manager</li>
            </ul>
            <p>You can create custom roles that match your venue's structure.</p>

            <h4>Locations</h4>
            <p>Locations are physical areas within your venue. Go to <strong>Staff > Locations</strong> to set these up:</p>
            <ul>
              <li>Bar</li>
              <li>Kitchen</li>
              <li>Floor</li>
              <li>Terrace</li>
              <li>Private Dining</li>
            </ul>

            <h4>Why This Matters</h4>
            <p>When employees are assigned roles and locations, you can:</p>
            <ul>
              <li>Filter the leaderboard by role or location</li>
              <li>See which areas are performing well</li>
              <li>Track feedback trends by team</li>
            </ul>

            <div class="tip-box">
              <strong>Best Practice:</strong> Set up roles and locations that match your venue's actual structure for more meaningful analytics.
            </div>
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
              <li>Go to <strong>Feedback > Questions</strong> in the sidebar</li>
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

            <div class="warning-box">
              <strong>Avoid:</strong> Complex wording, technical jargon, or asking too many questions at once. Customers are more likely to complete short, simple surveys.
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
              <li>Check that colour coding works correctly</li>
            </ul>

            <strong>3. Test Your Branding:</strong>
            <ul>
              <li>Verify your logo appears correctly</li>
              <li>Check that colours match your brand</li>
              <li>Ensure text is readable</li>
              <li>Test on different phone sizes</li>
            </ul>

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
              <li>Go to <strong>Settings > QR Code</strong> in the sidebar</li>
              <li>Your QR code is automatically generated for your current venue</li>
              <li>Choose your preferred size and format</li>
              <li>Click "Download"</li>
            </ol>

            <h4>Download Formats</h4>
            <ul>
              <li><strong>PNG:</strong> Best for digital displays and screens</li>
              <li><strong>SVG:</strong> Best for large prints (scales without quality loss)</li>
              <li><strong>PDF:</strong> Best for printing multiple codes at once</li>
            </ul>

            <div class="tip-box">
              <strong>Pro Tip:</strong> Generate multiple sizes if you're placing QR codes in different locations (small for receipts, large for wall displays).
            </div>
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
              <li>Upload your logo in <strong>Settings > Branding</strong></li>
              <li>Your logo will appear in the center of QR codes</li>
              <li>Recommended size: 200x200 pixels</li>
              <li>Format: PNG with transparent background works best</li>
            </ul>

            <div class="tip-box">
              <strong>Tip:</strong> Always test your QR codes before printing large quantities to ensure they scan correctly.
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
            </ul>

            <strong>On Receipts:</strong>
            <ul>
              <li>Print at the bottom of bills/receipts</li>
              <li>Add a call-to-action message</li>
            </ul>

            <strong>Wall Displays:</strong>
            <ul>
              <li>Near exits or restrooms</li>
              <li>At the host stand or reception desk</li>
              <li>In waiting areas</li>
            </ul>

            <h4>Placement Tips</h4>
            <ul>
              <li><strong>Eye level:</strong> Place at natural eye level when seated or standing</li>
              <li><strong>Good lighting:</strong> Avoid dark corners or harsh shadows</li>
              <li><strong>Protected:</strong> Use lamination or protective covers</li>
            </ul>

            <div class="tip-box">
              <strong>Pro Tip:</strong> Test different placements for a week and track which locations generate the most feedback.
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
              <li><strong>Recommended:</strong> 3-5cm for table placement</li>
              <li><strong>Large displays:</strong> 10cm+ for wall posters</li>
            </ul>

            <strong>Print Quality:</strong>
            <ul>
              <li>Use high-resolution images (minimum 300 DPI)</li>
              <li>Print on quality paper or card stock</li>
              <li>Laminate for durability</li>
            </ul>

            <h4>Troubleshooting</h4>
            <p><strong>If QR code won't scan:</strong></p>
            <ul>
              <li>Check that it's not too small</li>
              <li>Ensure adequate lighting</li>
              <li>Verify the print quality is sharp</li>
              <li>Try cleaning camera lens</li>
            </ul>
          `
        }
      ]
    },
    'questions': {
      title: 'Questions',
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
              <li>Navigate to <strong>Feedback > Questions</strong> in the sidebar</li>
              <li>Click "Add New Question" or use the text input field</li>
              <li>Type your question clearly and concisely</li>
              <li>Click "Add Question" to save</li>
            </ol>

            <h4>Question Limits</h4>
            <ul>
              <li><strong>Maximum questions:</strong> 5 active questions at once</li>
              <li><strong>Recommended:</strong> 3-4 questions for best completion rates</li>
            </ul>

            <h4>Writing Great Questions</h4>

            <strong>Do's:</strong>
            <ul>
              <li>Use simple, everyday language</li>
              <li>Ask about one specific aspect</li>
              <li>Keep questions short (under 10 words)</li>
              <li>Use "How was..." format</li>
            </ul>

            <strong>Don'ts:</strong>
            <ul>
              <li>Use complex or technical language</li>
              <li>Ask multiple things in one question</li>
              <li>Use industry jargon</li>
            </ul>
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
              <li>Go to <strong>Feedback > Questions</strong> in the sidebar</li>
              <li>Find the question you want to edit</li>
              <li>Click the pencil/edit icon</li>
              <li>Make your changes</li>
              <li>Click the checkmark to save</li>
            </ol>

            <h4>What Happens When You Edit</h4>
            <ul>
              <li>The question updates immediately for new feedback</li>
              <li>Historical data remains unchanged</li>
              <li>Analytics will show the new question text going forward</li>
            </ul>

            <div class="warning-box">
              <strong>Important:</strong> Major question changes can affect your historical data analysis. Consider the impact before making significant edits.
            </div>
          `
        },
        {
          id: 'archiving-questions',
          title: 'Archiving Questions',
          content: `
            <h3>Managing Your Question Archive</h3>
            <p>Learn how to archive questions you're not currently using.</p>

            <h4>What is the Question Archive?</h4>
            <p>The archive stores questions you're not currently using but may want to use again later:</p>
            <ul>
              <li>Don't appear on customer feedback forms</li>
              <li>Can be reactivated at any time</li>
              <li>Preserve their historical data</li>
            </ul>

            <h4>How to Archive a Question</h4>
            <ol>
              <li>Go to <strong>Feedback > Questions</strong> in the sidebar</li>
              <li>Find the question in your "Current Questions" list</li>
              <li>Click the trash/delete icon</li>
              <li>Confirm you want to archive it</li>
            </ol>

            <div class="tip-box">
              <strong>Strategy:</strong> Create seasonal question sets and rotate them in/out of the archive.
            </div>
          `
        }
      ]
    },
    'nps': {
      title: 'NPS',
      icon: BarChart3,
      description: 'Net Promoter Score tracking and analysis',
      articles: [
        {
          id: 'what-is-nps',
          title: 'What is NPS?',
          content: `
            <h3>Understanding Net Promoter Score</h3>
            <p>NPS (Net Promoter Score) is a metric that measures customer loyalty and satisfaction.</p>

            <h4>How NPS Works</h4>
            <p>Customers are asked: "How likely are you to recommend us to a friend or colleague?" on a scale of 0-10.</p>

            <ul>
              <li><strong>Promoters (9-10):</strong> Loyal enthusiasts who will keep buying and refer others</li>
              <li><strong>Passives (7-8):</strong> Satisfied but unenthusiastic customers</li>
              <li><strong>Detractors (0-6):</strong> Unhappy customers who can damage your brand</li>
            </ul>

            <h4>Calculating NPS</h4>
            <p>NPS = % of Promoters - % of Detractors</p>
            <p>The score ranges from -100 to +100.</p>

            <h4>What's a Good NPS?</h4>
            <ul>
              <li><strong>Above 0:</strong> Good</li>
              <li><strong>Above 20:</strong> Favourable</li>
              <li><strong>Above 50:</strong> Excellent</li>
              <li><strong>Above 80:</strong> World-class</li>
            </ul>
          `
        },
        {
          id: 'enabling-nps',
          title: 'Enabling NPS Emails',
          content: `
            <h3>Setting Up NPS Email Surveys</h3>
            <p>Enable NPS email surveys to measure customer loyalty after their visit.</p>

            <h4>How to Enable NPS Emails</h4>
            <ol>
              <li>Go to <strong>NPS > Settings</strong> in the sidebar</li>
              <li>Find the "NPS Email Surveys" section</li>
              <li>Toggle "Enable NPS Emails" to on</li>
              <li>Choose your preferred NPS question from the dropdown</li>
              <li>Click "Save Changes"</li>
            </ol>

            <h4>Available NPS Questions</h4>
            <p>Choose from four predefined questions:</p>
            <ul>
              <li>"How likely are you to recommend us to a friend or colleague?" (default)</li>
              <li>"How likely are you to recommend us to friends and family?"</li>
              <li>"How likely are you to visit us again?"</li>
              <li>"How likely are you to recommend us based on your experience?"</li>
            </ul>

            <h4>How NPS Emails Work</h4>
            <p>When enabled, customers who leave feedback will automatically receive an NPS survey email after the configured delay period. This allows you to capture their sentiment once they've had time to reflect on their experience.</p>

            <div class="tip-box">
              <strong>Best Practice:</strong> The default 24-hour delay works well for most venues, giving customers time to fully experience your service before asking for their rating.
            </div>
          `
        },
        {
          id: 'send-delay',
          title: 'NPS Send Delay',
          content: `
            <h3>Configuring NPS Email Timing</h3>
            <p>Control when NPS survey emails are sent to customers after they leave feedback.</p>

            <h4>How to Set Send Delay</h4>
            <ol>
              <li>Go to <strong>NPS > Settings</strong> in the sidebar</li>
              <li>Find the "Send Delay" section</li>
              <li>Choose your preferred delay time</li>
              <li>Click "Save Changes"</li>
            </ol>

            <h4>Available Delay Options</h4>
            <ul>
              <li><strong>12 hours:</strong> Good for quick-service venues where the experience is fresh</li>
              <li><strong>24 hours:</strong> Recommended for most venues - gives customers time to reflect</li>
              <li><strong>36 hours:</strong> Better for hotels or longer experiences</li>
            </ul>

            <h4>Why Delay Matters</h4>
            <p>The timing of your NPS survey can affect response rates and accuracy:</p>
            <ul>
              <li>Too soon: Customers may not have fully formed their opinion</li>
              <li>Too late: The experience becomes less memorable</li>
              <li>24 hours is the sweet spot for most hospitality venues</li>
            </ul>

            <div class="tip-box">
              <strong>Recommendation:</strong> Start with the default 24-hour delay and adjust based on your response rates and feedback quality.
            </div>
          `
        },
        {
          id: 'email-customisation',
          title: 'NPS Email Customisation',
          content: `
            <h3>Customising Your NPS Emails</h3>
            <p>Personalise your NPS survey emails to match your brand voice.</p>

            <h4>How to Customise</h4>
            <ol>
              <li>Go to <strong>NPS > Settings</strong> in the sidebar</li>
              <li>Scroll to the "Email Customisation" section</li>
              <li>Select your preferred options for each field</li>
              <li>Preview your email using the live preview</li>
              <li>Click "Save Changes"</li>
            </ol>

            <h4>Customisable Elements</h4>

            <strong>Email Subject:</strong>
            <ul>
              <li>"How was your visit to {venue_name}?"</li>
              <li>"We'd love your feedback, {venue_name}"</li>
              <li>"{venue_name} wants to hear from you"</li>
              <li>"Quick question about your visit to {venue_name}"</li>
            </ul>

            <strong>Email Greeting:</strong>
            <ul>
              <li>"Thank you for visiting {venue_name}!"</li>
              <li>"We hope you enjoyed your visit!"</li>
              <li>"Thanks for stopping by {venue_name}!"</li>
              <li>"We loved having you at {venue_name}!"</li>
            </ul>

            <strong>Email Body:</strong>
            <ul>
              <li>"We hope you had a great experience. We'd love to hear your feedback."</li>
              <li>"Your opinion matters to us. Please take a moment to share your thoughts."</li>
              <li>"We're always looking to improve. Would you mind sharing your experience?"</li>
              <li>"Help us serve you better by sharing a quick rating."</li>
            </ul>

            <strong>Button Text:</strong>
            <ul>
              <li>"Rate Your Experience" (default)</li>
              <li>"Share Your Feedback"</li>
              <li>"Take Quick Survey"</li>
              <li>"Give Us Your Rating"</li>
            </ul>

            <h4>Testing Your Email</h4>
            <p>Use the "Send Test Email" button to send a preview to your own email address before going live.</p>

            <div class="tip-box">
              <strong>Note:</strong> The {venue_name} placeholder will automatically be replaced with your venue's name in actual emails.
            </div>
          `
        },
        {
          id: 'review-prompt-threshold',
          title: 'NPS Review Prompt Threshold',
          content: `
            <h3>Setting Your Review Prompt Threshold</h3>
            <p>Control which customers see prompts to leave Google or TripAdvisor reviews after completing their NPS survey.</p>

            <h4>How It Works</h4>
            <p>After a customer completes their NPS survey, they may be shown links to leave reviews on Google or TripAdvisor. The threshold setting determines the minimum NPS score required to show these prompts.</p>

            <h4>How to Configure</h4>
            <ol>
              <li>Go to <strong>NPS > Settings</strong> in the sidebar</li>
              <li>Find the "NPS Review Prompt Threshold" section</li>
              <li>Select your minimum score (0-10)</li>
              <li>Click "Save Changes"</li>
            </ol>

            <h4>Choosing the Right Threshold</h4>
            <ul>
              <li><strong>9-10 (Recommended):</strong> Only Promoters see review prompts - these are your happiest customers most likely to leave positive reviews</li>
              <li><strong>8:</strong> Includes some Passives - slightly broader reach but may include less enthusiastic customers</li>
              <li><strong>7 or lower:</strong> Not recommended - you risk directing neutral or unhappy customers to public review sites</li>
            </ul>

            <h4>Why This Matters</h4>
            <p>The goal is to encourage your happiest customers to share their experience publicly, whilst avoiding directing unhappy customers to review platforms where they might leave negative feedback.</p>

            <div class="warning-box">
              <strong>Important:</strong> The default threshold of 9 is recommended for most venues. Only lower this if you're confident in your service quality.
            </div>

            <div class="tip-box">
              <strong>Tip:</strong> Make sure you've added your Google and TripAdvisor review links in <strong>Settings > Integrations</strong> for the review prompts to appear.
            </div>
          `
        },
        {
          id: 'nps-analytics',
          title: 'NPS Analytics',
          content: `
            <h3>Analysing Your NPS Data</h3>
            <p>Use NPS analytics to track customer loyalty trends.</p>

            <h4>Viewing NPS Reports</h4>
            <ol>
              <li>Go to <strong>NPS > Score</strong> in the sidebar</li>
              <li>Select your date range</li>
              <li>View your overall NPS score</li>
              <li>See breakdown of Promoters, Passives, and Detractors</li>
            </ol>

            <h4>Key Insights</h4>
            <ul>
              <li><strong>Trend over time:</strong> Is your NPS improving or declining?</li>
              <li><strong>By venue:</strong> Compare NPS across locations (via <strong>NPS > Insights</strong>)</li>
              <li><strong>By time:</strong> See if NPS varies by day or time</li>
            </ul>
          `
        }
      ]
    },
    'kiosk-mode': {
      title: 'Kiosk Mode',
      icon: Monitor,
      description: 'Real-time feedback monitoring on tablets',
      articles: [
        {
          id: 'understanding-kiosk',
          title: 'Understanding Kiosk Mode',
          content: `
            <h3>What is Kiosk Mode?</h3>
            <p>Kiosk Mode is a real-time dashboard designed for tablets, allowing staff to monitor feedback as it comes in.</p>

            <h4>Key Features</h4>
            <ul>
              <li>Real-time feedback alerts</li>
              <li>Visual floor plan with table status</li>
              <li>Colour-coded feedback indicators</li>
              <li>Quick response actions</li>
            </ul>

            <h4>How It Works</h4>
            <ol>
              <li>Place a tablet at your host stand or kitchen</li>
              <li>Open the Kiosk Mode dashboard</li>
              <li>Monitor incoming feedback in real-time</li>
              <li>Respond to issues immediately</li>
            </ol>

            <div class="tip-box">
              <strong>Best Practice:</strong> Mount a tablet where all staff can see it to encourage quick response to feedback.
            </div>
          `
        },
        {
          id: 'floor-plan-setup',
          title: 'Setting Up Your Floor Plan',
          content: `
            <h3>Creating Your Floor Plan</h3>
            <p>A visual floor plan helps staff quickly identify which tables need attention.</p>

            <h4>How to Set Up</h4>
            <ol>
              <li>Go to <strong>Floor Plan</strong> in the sidebar</li>
              <li>Click "Edit Floor Plan"</li>
              <li>Drag and drop tables to match your layout</li>
              <li>Number each table correctly</li>
              <li>Save your floor plan</li>
            </ol>

            <h4>Tips for Accuracy</h4>
            <ul>
              <li>Match the physical layout as closely as possible</li>
              <li>Use consistent table numbering</li>
              <li>Update when your layout changes</li>
            </ul>
          `
        },
        {
          id: 'alert-colours',
          title: 'Alert Colours Explained',
          content: `
            <h3>Understanding Alert Colours</h3>
            <p>Kiosk Mode uses colours to indicate feedback status at a glance.</p>

            <h4>Colour Guide</h4>
            <ul>
              <li><strong style="color: #22c55e;">Green:</strong> Positive feedback (4-5 stars)</li>
              <li><strong style="color: #f59e0b;">Amber:</strong> Neutral feedback (3 stars)</li>
              <li><strong style="color: #ef4444;">Red:</strong> Negative feedback (1-2 stars) - requires attention</li>
              <li><strong style="color: #3b82f6;">Blue:</strong> Assistance request</li>
            </ul>

            <h4>Priority Actions</h4>
            <p>When you see red alerts:</p>
            <ol>
              <li>Respond within 2-3 minutes if possible</li>
              <li>Send a manager to the table</li>
              <li>Resolve the issue and mark as addressed</li>
            </ol>

            <div class="warning-box">
              <strong>Important:</strong> Red alerts represent opportunities to turn unhappy customers into loyal ones. Quick response is key!
            </div>
          `
        }
      ]
    },
    'team-management': {
      title: 'Team Management',
      icon: Users,
      description: 'Managing staff, roles, and permissions',
      articles: [
        {
          id: 'adding-team-members',
          title: 'Adding Team Members',
          content: `
            <h3>Understanding Team Member Types</h3>
            <p>Chatters has two types of team members you can add to your venue, each serving a different purpose.</p>

            <h4>Employees</h4>
            <p>Front-line staff members who interact with customers and can receive recognition.</p>
            <ul>
              <li><strong>No login account required</strong> - Employees don't need to log in to Chatters</li>
              <li><strong>Recognition emails</strong> - Their email address is used to send recognition emails when a manager sends them recognition for great work</li>
              <li><strong>Appear on leaderboard</strong> - They show up on the staff leaderboard and can be tracked for performance</li>
              <li><strong>Feedback resolution</strong> - Can be assigned to resolve feedback in kiosk mode</li>
            </ul>

            <h4>Managers</h4>
            <p>Team leaders who need access to the Chatters dashboard to view and manage feedback.</p>
            <ul>
              <li><strong>Have their own login account</strong> - Managers get full dashboard access</li>
              <li><strong>Receive invitation email</strong> - They'll get an email with instructions to set up their password and log in</li>
              <li><strong>View feedback and analytics</strong> - Can see customer feedback, reports, and trends</li>
              <li><strong>Customisable permissions</strong> - You can control exactly what each manager can see and do</li>
            </ul>

            <div class="tip-box">
              <strong>Tip:</strong> Add all your front-of-house staff as Employees so they can receive recognition emails. Only add Managers for team leaders who need dashboard access.
            </div>

            <h4>How to Add Employees</h4>
            <ol>
              <li>Navigate to <strong>Staff > Team</strong> in the sidebar, then select the <strong>Employees</strong> tab</li>
              <li>Click "Add Employee"</li>
              <li>Enter their first name, last name, and email address</li>
              <li>Assign a role (required) and optionally a location</li>
              <li>Click "Save" - they're added immediately</li>
            </ol>
            <p>No invitation is sent - they'll simply start receiving recognition emails when a manager sends them recognition.</p>

            <h4>How to Add Managers</h4>
            <ol>
              <li>Navigate to <strong>Staff > Team</strong> in the sidebar, then select the <strong>Managers</strong> tab</li>
              <li>Click "Add Manager"</li>
              <li>Enter their first name, last name, and email address</li>
              <li>Select which venues they can access (you can choose multiple)</li>
              <li>Assign their permissions</li>
              <li>Click "Save" to send the invitation email</li>
            </ol>
            <p>They'll receive an email with a link to set up their password and access the dashboard.</p>

            <div class="warning-box">
              <strong>Important:</strong> If a manager doesn't receive their invitation email, check their spam/junk folder. You can resend the invitation from the Managers tab.
            </div>
          `
        },
        {
          id: 'managing-permissions',
          title: 'Managing Permissions',
          content: `
            <h3>Understanding User Permissions</h3>
            <p>Control what each manager can see and do within Chatters.</p>

            <h4>User Types</h4>
            <ul>
              <li><strong>Account Owner (Master):</strong> Full access to all venues and settings, can invite managers</li>
              <li><strong>Manager:</strong> Access to assigned venues with customisable permissions</li>
            </ul>

            <h4>Permission Categories</h4>
            <p>Managers can be granted access to specific areas:</p>
            <ul>
              <li><strong>Feedback:</strong> View and manage customer feedback</li>
              <li><strong>Questions:</strong> Create and edit feedback questions</li>
              <li><strong>Reports:</strong> View analytics and export reports</li>
              <li><strong>NPS:</strong> Access NPS scores and settings</li>
              <li><strong>Staff:</strong> View and manage employees</li>
              <li><strong>Venue Settings:</strong> Change branding and configuration</li>
              <li><strong>Floor Plan:</strong> Edit venue floor layout</li>
              <li><strong>QR Codes:</strong> Generate and customise QR codes</li>
              <li><strong>AI Features:</strong> Access AI insights and chat</li>
              <li><strong>Billing:</strong> View billing information</li>
            </ul>

            <h4>How to Manage Permissions</h4>
            <ol>
              <li>Go to <strong>Staff > Team</strong> in the sidebar</li>
              <li>Find the manager whose permissions you want to edit</li>
              <li>Click "Manage Permissions"</li>
              <li>Select a role template or customise individual permissions</li>
              <li>Save changes</li>
            </ol>

            <div class="tip-box">
              <strong>Note:</strong> Only account owners can manage permissions for managers.
            </div>
          `
        },
        {
          id: 'permission-templates',
          title: 'Permission Templates',
          content: `
            <h3>Understanding Permission Templates</h3>
            <p>Permission templates are predefined sets of permissions that make it easy to assign consistent access levels to managers across your venues.</p>

            <h4>Available Templates</h4>
            <p>Chatters provides several built-in templates:</p>
            <ul>
              <li><strong>Admin:</strong> Full access to all features including billing, manager management, and venue settings</li>
              <li><strong>Manager:</strong> Access to feedback, reports, staff management, and day-to-day operations - but not billing or system settings</li>
              <li><strong>Viewer:</strong> Read-only access to view feedback and reports without the ability to make changes</li>
            </ul>

            <h4>How to Use Templates</h4>
            <p>When assigning permissions to a manager:</p>
            <ol>
              <li>Go to <strong>Staff > Team</strong> and select the <strong>Managers</strong> tab</li>
              <li>Find the manager and click "Manage Permissions"</li>
              <li>Select a role template from the available options</li>
              <li>The permissions will automatically be applied based on the template</li>
              <li>Click "Save Permissions"</li>
            </ol>

            <h4>Managing Templates (Master Users Only)</h4>
            <p>Account owners can view and manage permission templates:</p>
            <ol>
              <li>Go to <strong>Administration > Permission Templates</strong> in the sidebar</li>
              <li>View all available templates and their included permissions</li>
              <li>Create custom templates for your organisation's specific needs</li>
            </ol>

            <h4>Customising Permissions</h4>
            <p>If the templates don't quite fit your needs, you can create custom permission sets:</p>
            <ol>
              <li>Select a template as a starting point, or start from scratch</li>
              <li>Click "Customise" to unlock individual permission toggles</li>
              <li>Expand each category to see available permissions</li>
              <li>Toggle individual permissions on or off</li>
              <li>Save your custom permission set</li>
            </ol>

            <h4>Permission Categories</h4>
            <p>Permissions are organised into categories:</p>
            <ul>
              <li><strong>Feedback:</strong> View, respond to, delete, and export feedback</li>
              <li><strong>Questions:</strong> View and edit feedback questions</li>
              <li><strong>Reports:</strong> Access analytics and export data</li>
              <li><strong>NPS:</strong> View and export NPS scores</li>
              <li><strong>Staff:</strong> Manage employees, leaderboard, and recognition</li>
              <li><strong>Managers:</strong> View, invite, remove managers and change permissions</li>
              <li><strong>Venue Settings:</strong> Edit branding and integrations</li>
              <li><strong>Floor Plan:</strong> View and edit the floor layout</li>
              <li><strong>QR Codes:</strong> View and generate QR codes</li>
              <li><strong>AI Features:</strong> Access AI insights and chat</li>
              <li><strong>Reviews:</strong> View and respond to external reviews</li>
              <li><strong>Billing:</strong> View and manage subscription</li>
              <li><strong>Multi-Venue:</strong> Access multi-venue overview and comparisons</li>
            </ul>

            <h4>Permission Scope</h4>
            <p>You can set permissions at two levels:</p>
            <ul>
              <li><strong>Account-wide:</strong> The same permissions apply across all venues the manager has access to</li>
              <li><strong>Venue-specific:</strong> Different permissions for different venues - useful when a manager has different responsibilities at each location</li>
            </ul>

            <div class="tip-box">
              <strong>Best Practice:</strong> Start with a template that closely matches the manager's role, then customise individual permissions as needed. This ensures consistency while allowing flexibility.
            </div>

            <div class="warning-box">
              <strong>Important:</strong> Only account owners (Master users) can manage permissions for managers. Managers cannot change their own permissions or those of other managers.
            </div>
          `
        },
        {
          id: 'staff-leaderboard',
          title: 'Staff Leaderboard',
          content: `
            <h3>Using the Staff Leaderboard</h3>
            <p>Track and celebrate your top performers.</p>

            <h4>Accessing the Leaderboard</h4>
            <p>Navigate to <strong>Staff > Leaderboard</strong> in the sidebar to view team performance rankings.</p>

            <h4>What the Leaderboard Shows</h4>
            <ul>
              <li>Staff rankings by feedback score</li>
              <li>Number of positive mentions</li>
              <li>Response time metrics</li>
              <li>Customer satisfaction trends</li>
            </ul>

            <h4>Best Practices</h4>
            <ul>
              <li>Share leaderboard results with your team</li>
              <li>Recognise top performers (see <strong>Staff > Recognition</strong>)</li>
              <li>Use data for coaching opportunities</li>
            </ul>

            <div class="tip-box">
              <strong>Motivation Tip:</strong> Consider rewards or recognition for consistently top-ranked staff members. Use <strong>Staff > Recognition</strong> to send automated appreciation emails.
            </div>
          `
        }
      ]
    },
    'analytics': {
      title: 'Analytics & Reports',
      icon: BarChart3,
      description: 'Understanding your data and insights',
      articles: [
        {
          id: 'understanding-dashboard',
          title: 'Understanding Your Dashboard',
          content: `
            <h3>Dashboard Overview</h3>
            <p>Your dashboard provides a snapshot of your venue's performance.</p>

            <h4>Key Metrics</h4>
            <ul>
              <li><strong>Overall Rating:</strong> Average star rating across all feedback</li>
              <li><strong>Response Rate:</strong> Percentage of feedback requiring response</li>
              <li><strong>Trend:</strong> How ratings are changing over time</li>
              <li><strong>Volume:</strong> Number of feedback submissions</li>
            </ul>

            <h4>Quick Insights</h4>
            <ul>
              <li>Best and worst performing areas</li>
              <li>Peak feedback times</li>
              <li>Staff performance highlights</li>
            </ul>
          `
        },
        {
          id: 'exporting-data',
          title: 'Exporting Data',
          content: `
            <h3>Exporting Your Data</h3>
            <p>Export your feedback data for analysis or record-keeping.</p>

            <h4>Export Options</h4>
            <ul>
              <li><strong>CSV:</strong> For spreadsheet analysis</li>
              <li><strong>PDF:</strong> For presentations and reports</li>
            </ul>

            <h4>How to Export</h4>
            <ol>
              <li>Go to <strong>Reports > Performance</strong> or <strong>Reports > Metrics</strong></li>
              <li>Select your date range</li>
              <li>Choose filters if needed</li>
              <li>Click "Export"</li>
              <li>Select your format</li>
            </ol>
          `
        },
        {
          id: 'ai-insights',
          title: 'AI Insights',
          content: `
            <h3>Using AI Insights</h3>
            <p>Chatters AI analyses your feedback to surface actionable insights.</p>

            <h4>What AI Insights Provides</h4>
            <ul>
              <li>Sentiment analysis of comments</li>
              <li>Trending topics in feedback</li>
              <li>Suggested action items</li>
              <li>Comparison to industry benchmarks</li>
            </ul>

            <h4>Accessing AI Insights</h4>
            <ol>
              <li>Go to <strong>AI > Weekly Insights</strong> in the sidebar</li>
              <li>View automatically generated insights</li>
              <li>Click on any insight for details</li>
              <li>Use <strong>AI > Chat</strong> for specific questions</li>
            </ol>

            <div class="tip-box">
              <strong>Pro Tip:</strong> Use AI Chat to ask questions like "What are customers saying about our service?" or "What should we improve?"
            </div>
          `
        }
      ]
    },
    'customisation': {
      title: 'Customisation',
      icon: Palette,
      description: 'Branding and appearance settings',
      articles: [
        {
          id: 'branding',
          title: 'Branding Your Feedback Forms',
          content: `
            <h3>Customising Your Brand</h3>
            <p>Make your feedback forms match your venue's identity.</p>

            <h4>How to Update Branding</h4>
            <ol>
              <li>Go to <strong>Settings > Branding</strong> in the sidebar</li>
              <li>Upload your assets and configure colours</li>
              <li>Preview your changes</li>
              <li>Save</li>
            </ol>

            <h4>Branding Assets</h4>
            <ul>
              <li><strong>Logo:</strong> Square image, minimum 100x100px (PNG, JPG, or any image format)</li>
              <li><strong>Splash Page Background:</strong> Landscape image, 1920x1080px recommended</li>
            </ul>

            <h4>Brand Colours</h4>
            <ul>
              <li><strong>Primary colour:</strong> Used for buttons and accents</li>
              <li><strong>Background colour:</strong> Page background (if no background image)</li>
              <li><strong>Text colour:</strong> Main text on feedback forms</li>
              <li><strong>Button text colour:</strong> Text displayed on buttons</li>
            </ul>

            <h4>Confirmation Messages</h4>
            <p>Customise the messages customers see after actions:</p>
            <ul>
              <li><strong>Assistance Request:</strong> Shown when a customer requests help - includes emoji, title, and message. Use {'{table}'} to insert the table number dynamically.</li>
              <li><strong>Thank You:</strong> Shown after feedback is submitted - includes emoji, title, and message.</li>
            </ul>

            <div class="tip-box">
              <strong>Best Practice:</strong> Use high-quality images and consistent colours across all touchpoints. Images are saved automatically when uploaded.
            </div>
          `
        },
        {
          id: 'feedback-hours',
          title: 'Setting Feedback Hours',
          content: `
            <h3>Configuring Feedback Hours</h3>
            <p>Control when customers can submit feedback by setting your venue's operating hours.</p>

            <h4>Why Set Feedback Hours?</h4>
            <ul>
              <li>Match your opening hours</li>
              <li>Prevent off-hours submissions</li>
              <li>Focus on relevant feedback</li>
            </ul>

            <h4>How to Set Hours</h4>
            <ol>
              <li>Go to <strong>Feedback > Settings</strong> in the sidebar</li>
              <li>Enable "Feedback Hours"</li>
              <li>Set start and end times for each day</li>
              <li>Save your settings</li>
            </ol>

            <h4>Multiple Time Slots</h4>
            <p>If your venue has a break during the day (e.g. closed between lunch and dinner service), you can add multiple time slots for each day.</p>
            <p><strong>Example:</strong> A restaurant open for lunch and dinner might set:</p>
            <ul>
              <li>9:00am - 11:00am (breakfast)</li>
              <li>1:00pm - 4:00pm (lunch)</li>
              <li>6:00pm - 10:00pm (dinner)</li>
            </ul>
            <p>Feedback will only be accepted during these time windows.</p>
          `
        }
      ]
    },
    'integrations': {
      title: 'Integrations',
      icon: Settings,
      description: 'Connect with other tools and platforms',
      articles: [
        {
          id: 'google-business',
          title: 'Google Business Profile',
          content: `
            <h3>Connecting Google Business Profile</h3>
            <p>Link your Google Business Profile to track your ratings alongside customer feedback.</p>

            <h4>How to Connect</h4>
            <ol>
              <li>Go to <strong>Settings > Integrations</strong> in the sidebar</li>
              <li>Search for your venue in the Google Business section</li>
              <li>Select your listing from the search results</li>
              <li>The connection is saved automatically</li>
            </ol>

            <h4>What You'll See</h4>
            <ul>
              <li>Your Google rating displayed in your dashboard</li>
              <li>Rating trends over time</li>
            </ul>
          `
        },
        {
          id: 'tripadvisor',
          title: 'TripAdvisor',
          content: `
            <h3>Connecting TripAdvisor</h3>
            <p>Link your TripAdvisor listing to track your ratings alongside customer feedback.</p>

            <h4>How to Connect</h4>
            <ol>
              <li>Go to <strong>Settings > Integrations</strong> in the sidebar</li>
              <li>Search for your venue in the TripAdvisor section</li>
              <li>Select your listing from the search results</li>
              <li>The connection is saved automatically</li>
            </ol>

            <h4>What You'll See</h4>
            <ul>
              <li>Your TripAdvisor rating displayed in your dashboard</li>
              <li>Rating trends over time</li>
            </ul>
          `
        }
      ]
    },
    'billing': {
      title: 'Billing & Account',
      icon: CreditCard,
      description: 'Manage your subscription and billing',
      articles: [
        {
          id: 'understanding-plans',
          title: 'Understanding Your Plan',
          content: `
            <h3>Chatters Pricing</h3>
            <p>Chatters offers simple, transparent pricing tailored to your venue.</p>

            <h4>How Pricing Works</h4>
            <p>We don't use complicated tiers. Instead, we provide one fair rate based on:</p>
            <ul>
              <li>Number of venues/locations</li>
              <li>Your specific needs and requirements</li>
            </ul>

            <h4>What's Included in Every Plan</h4>
            <ul>
              <li>Unlimited guest feedback</li>
              <li>Unlimited staff access (no per-user fees)</li>
              <li>All features from day one</li>
              <li>Instant staff alerts</li>
              <li>Analytics and insights</li>
              <li>Custom branding</li>
              <li>NPS scoring</li>
              <li>Staff leaderboards</li>
              <li>Real-time kiosk mode</li>
              <li>Google and TripAdvisor review routing</li>
              <li>Dedicated support</li>
            </ul>

            <div class="tip-box">
              <strong>Free Trial:</strong> New accounts start with a 14-day free trial so you can experience Chatters before committing.
            </div>
          `
        },
        {
          id: 'managing-subscription',
          title: 'Managing Your Subscription',
          content: `
            <h3>Subscription Management</h3>
            <p>View and manage your billing details.</p>

            <h4>How to Manage</h4>
            <ol>
              <li>Go to <strong>Account Settings > Billing</strong> at the bottom of the sidebar</li>
              <li>View your current plan</li>
              <li>Update payment method</li>
              <li>View billing history</li>
              <li>Download invoices</li>
            </ol>

            <h4>Upgrading</h4>
            <p>To upgrade your plan:</p>
            <ol>
              <li>Click "Upgrade Plan"</li>
              <li>Select your new plan</li>
              <li>Confirm the change</li>
              <li>New features activate immediately</li>
            </ol>
          `
        }
      ]
    },
    'troubleshooting': {
      title: 'Troubleshooting',
      icon: Wrench,
      description: 'Common issues and solutions',
      articles: [
        {
          id: 'qr-not-scanning',
          title: 'QR Code Not Scanning',
          content: `
            <h3>QR Code Troubleshooting</h3>
            <p>Having trouble with your QR codes? Try these solutions.</p>

            <h4>Common Issues</h4>

            <strong>QR code is too small:</strong>
            <ul>
              <li>Minimum size should be 2cm x 2cm</li>
              <li>Regenerate at a larger size</li>
            </ul>

            <strong>Poor lighting:</strong>
            <ul>
              <li>Ensure adequate lighting on the QR code</li>
              <li>Avoid glare from lamination</li>
            </ul>

            <strong>Print quality issues:</strong>
            <ul>
              <li>Print at 300 DPI or higher</li>
              <li>Ensure high contrast</li>
              <li>Replace worn or damaged codes</li>
            </ul>

            <strong>Camera issues:</strong>
            <ul>
              <li>Clean the phone camera lens</li>
              <li>Ensure camera has permission to scan</li>
              <li>Try different QR scanner apps</li>
            </ul>
          `
        },
        {
          id: 'no-feedback',
          title: 'No Feedback Appearing',
          content: `
            <h3>Missing Feedback</h3>
            <p>Not seeing feedback in your dashboard? Check these things:</p>

            <h4>Checklist</h4>
            <ul>
              <li><strong>Correct venue selected:</strong> Make sure you're viewing the right venue</li>
              <li><strong>Date range:</strong> Check your date filter</li>
              <li><strong>Feedback hours:</strong> Confirm submissions are within your feedback hours</li>
              <li><strong>QR code working:</strong> Test your QR code yourself</li>
            </ul>

            <h4>Still Not Working?</h4>
            <ol>
              <li>Submit test feedback yourself</li>
              <li>Check if it appears in the dashboard</li>
              <li>If not, contact support</li>
            </ol>
          `
        },
        {
          id: 'kiosk-not-updating',
          title: 'Kiosk Mode Not Updating',
          content: `
            <h3>Kiosk Mode Issues</h3>
            <p>Real-time updates not appearing? Try these fixes.</p>

            <h4>Quick Fixes</h4>
            <ul>
              <li><strong>Refresh the page:</strong> Press F5 or pull down to refresh</li>
              <li><strong>Check internet:</strong> Ensure stable Wi-Fi connection</li>
              <li><strong>Clear cache:</strong> Clear browser cache and cookies</li>
              <li><strong>Log out and back in:</strong> Refresh your session</li>
            </ul>

            <h4>For Tablets</h4>
            <ul>
              <li>Ensure tablet hasn't gone to sleep</li>
              <li>Disable power-saving modes</li>
              <li>Keep browser tab active</li>
            </ul>

            <div class="tip-box">
              <strong>Recommendation:</strong> Use a dedicated tablet with screen-always-on settings for best results.
            </div>
          `
        }
      ]
    },
    'security': {
      title: 'Security & Privacy',
      icon: Shield,
      description: 'Data protection and compliance',
      articles: [
        {
          id: 'data-security',
          title: 'Data Security Overview',
          content: `
            <h3>How We Protect Your Data</h3>
            <p>Chatters takes data security seriously.</p>

            <h4>Security Measures</h4>
            <ul>
              <li><strong>Encryption:</strong> All data encrypted in transit and at rest</li>
              <li><strong>Secure hosting:</strong> Enterprise-grade cloud infrastructure</li>
              <li><strong>Access controls:</strong> Role-based permissions</li>
              <li><strong>Regular audits:</strong> Ongoing security assessments</li>
            </ul>

            <h4>Your Responsibilities</h4>
            <ul>
              <li>Use strong, unique passwords</li>
              <li>Review team access regularly</li>
              <li>Report suspicious activity</li>
            </ul>
          `
        },
        {
          id: 'gdpr',
          title: 'GDPR Compliance',
          content: `
            <h3>GDPR and Data Privacy</h3>
            <p>Chatters is designed with GDPR compliance in mind.</p>

            <h4>How Chatters Helps</h4>
            <ul>
              <li><strong>Data minimisation:</strong> We only collect necessary data</li>
              <li><strong>Consent:</strong> Clear opt-in for feedback collection</li>
              <li><strong>Right to erasure:</strong> Delete customer data on request</li>
              <li><strong>Data portability:</strong> Export your data anytime</li>
            </ul>

            <h4>Your Obligations</h4>
            <ul>
              <li>Display privacy notices at point of collection</li>
              <li>Respond to data subject requests</li>
              <li>Maintain records of processing</li>
            </ul>

            <div class="tip-box">
              <strong>Need Help?</strong> Contact us for a Data Processing Agreement or to discuss specific compliance requirements.
            </div>
          `
        }
      ]
    },
    'assistance': {
      title: 'Assistance Requests',
      icon: MessageSquare,
      description: 'Managing customer assistance requests',
      articles: [
        {
          id: 'what-are-assistance',
          title: 'What Are Assistance Requests?',
          content: `
            <h3>Understanding Assistance Requests</h3>
            <p>Assistance Requests let customers ask for help directly from their table.</p>

            <h4>How It Works</h4>
            <ol>
              <li>Customer scans your QR code</li>
              <li>They tap "Just need assistance?"</li>
              <li>Select their table number</li>
              <li>Alert appears on your Kiosk Mode</li>
            </ol>

            <h4>Types of Requests</h4>
            <ul>
              <li>Order assistance</li>
              <li>Bill request</li>
              <li>General help</li>
              <li>Refill requests</li>
            </ul>

            <div class="tip-box">
              <strong>Best Practice:</strong> Respond to assistance requests within 2-3 minutes to ensure great customer experience.
            </div>
          `
        },
        {
          id: 'responding-assistance',
          title: 'Responding to Requests',
          content: `
            <h3>Handling Assistance Requests</h3>
            <p>Learn how to effectively respond to customer requests.</p>

            <h4>On the Kiosk</h4>
            <ol>
              <li>See the alert appear with table number</li>
              <li>Send staff to the table</li>
              <li>Address the customer's need</li>
              <li>Mark request as resolved</li>
            </ol>

            <h4>Best Practices</h4>
            <ul>
              <li>Acknowledge requests quickly</li>
              <li>Don't let requests pile up</li>
              <li>Train all staff on the system</li>
              <li>Follow up to ensure satisfaction</li>
            </ul>
          `
        }
      ]
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
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

  // Derive selected category and article from URL params
  const selectedCategory = categorySlug && helpContent[categorySlug] ? categorySlug : null;
  const selectedArticle = selectedCategory && articleSlug
    ? helpContent[selectedCategory]?.articles.find(a => a.id === articleSlug)
    : null;

  // Expand category when navigating to it via URL
  useEffect(() => {
    if (categorySlug && helpContent[categorySlug]) {
      setExpandedCategories(prev => ({
        ...prev,
        [categorySlug]: true
      }));
    }
  }, [categorySlug]);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug, articleSlug]);

  // View handlers - now use URL navigation
  const handleCategoryClick = (categoryKey) => {
    navigate(`/help/${categoryKey}`);
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: true
    }));
  };

  const handleArticleClick = (article, categoryKey) => {
    navigate(`/help/${categoryKey}/${article.id}`);
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: true
    }));
  };

  const handleBackToCategories = () => {
    navigate('/help');
  };

  const handleBackToCategory = () => {
    navigate(`/help/${selectedCategory}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Help Centre | Chatters</title>
        <meta name="description" content="Get help with Chatters - customer feedback platform for hospitality" />
      </Helmet>

      <Navbar overlay={false} />

      {/* Hero Section - pt-16 accounts for fixed navbar height */}
      <div className="bg-gradient-to-b from-[#4E74FF] to-[#3B5BDB] text-white pt-28 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 font-plusjakarta">Help Centre</h1>
          <p className="text-lg text-blue-100 mb-6 font-plusjakarta">Find answers and learn how to use Chatters</p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 text-base focus:outline-none focus:ring-4 focus:ring-blue-300 font-plusjakarta"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Zendesk Style Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Results */}
        {searchResults && searchResults.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setSearchTerm('')}
                className="flex items-center text-[#4E74FF] hover:text-[#3B5BDB] font-medium font-plusjakarta"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Clear search
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-plusjakarta">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
            </h2>
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => {
                    handleArticleClick(result, result.categoryKey);
                    setSearchTerm('');
                  }}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                >
                  <div className="text-sm text-[#4E74FF] font-medium mb-1 font-plusjakarta">{result.categoryTitle}</div>
                  <h3 className="text-base font-semibold text-gray-900 font-plusjakarta">{result.title}</h3>
                </div>
              ))}
            </div>
          </div>
        ) : searchResults && searchResults.length === 0 ? (
          <div className="text-center py-12 max-w-4xl mx-auto">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 font-plusjakarta">No results found</h3>
            <p className="text-gray-600 font-plusjakarta">Try different search terms or browse the categories</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-[#4E74FF] hover:text-[#3B5BDB] font-medium font-plusjakarta"
            >
              Clear search
            </button>
          </div>
        ) : (
          /* Zendesk-style layout with sidebar */
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Categories */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-4">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-900 font-plusjakarta">Categories</h2>
                </div>
                <nav className="p-2">
                  {Object.keys(helpContent).map((categoryKey) => {
                    const category = helpContent[categoryKey];
                    const Icon = category.icon;
                    const isExpanded = expandedCategories[categoryKey];
                    const isSelected = selectedCategory === categoryKey;

                    return (
                      <div key={categoryKey} className="mb-1">
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(categoryKey)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-[#4E74FF]'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#4E74FF]' : 'text-gray-500'}`} />
                            <span className="font-medium text-sm font-plusjakarta">{category.title}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        {/* Sub-items (Articles) */}
                        {isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {category.articles.map((article) => (
                              <button
                                key={article.id}
                                onClick={() => handleArticleClick(article, categoryKey)}
                                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                                  selectedArticle?.id === article.id
                                    ? 'bg-blue-100 text-[#4E74FF] font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                } font-plusjakarta`}
                              >
                                {article.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {selectedArticle ? (
                /* Article View */
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  {/* Breadcrumb */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-plusjakarta">
                      <button
                        onClick={handleBackToCategories}
                        className="text-[#4E74FF] hover:text-[#3B5BDB]"
                      >
                        Help Centre
                      </button>
                      <ChevronRight className="w-4 h-4" />
                      <button
                        onClick={handleBackToCategory}
                        className="text-[#4E74FF] hover:text-[#3B5BDB]"
                      >
                        {helpContent[selectedCategory].title}
                      </button>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-gray-900">{selectedArticle.title}</span>
                    </div>
                  </div>

                  {/* Article Content */}
                  <div className="p-6 lg:p-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 font-plusjakarta">
                      {selectedArticle.title}
                    </h1>
                    <div
                      className="prose prose-lg max-w-none font-plusjakarta"
                      dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                    />
                  </div>

                  {/* Related Articles */}
                  <div className="px-6 lg:px-8 pb-6 lg:pb-8">
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-plusjakarta">
                        More in {helpContent[selectedCategory].title}
                      </h3>
                      <div className="space-y-2">
                        {helpContent[selectedCategory].articles
                          .filter(a => a.id !== selectedArticle.id)
                          .slice(0, 3)
                          .map((article) => (
                            <button
                              key={article.id}
                              onClick={() => handleArticleClick(article, selectedCategory)}
                              className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                            >
                              <span className="text-gray-700 group-hover:text-[#4E74FF] font-medium font-plusjakarta">
                                {article.title}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#4E74FF]" />
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedCategory ? (
                /* Category Article List */
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-plusjakarta">
                      <button
                        onClick={handleBackToCategories}
                        className="text-[#4E74FF] hover:text-[#3B5BDB]"
                      >
                        Help Centre
                      </button>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-gray-900">{helpContent[selectedCategory].title}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      {React.createElement(helpContent[selectedCategory].icon, {
                        className: "w-10 h-10 text-[#4E74FF]"
                      })}
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 font-plusjakarta">
                          {helpContent[selectedCategory].title}
                        </h1>
                        <p className="text-gray-600 font-plusjakarta">
                          {helpContent[selectedCategory].description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {helpContent[selectedCategory].articles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => handleArticleClick(article, selectedCategory)}
                          className="w-full text-left flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                        >
                          <span className="text-gray-800 group-hover:text-[#4E74FF] font-medium font-plusjakarta">
                            {article.title}
                          </span>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#4E74FF]" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Category Grid - Home View */
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 font-plusjakarta">Browse by Category</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.keys(helpContent).map((categoryKey) => {
                      const category = helpContent[categoryKey];
                      const Icon = category.icon;
                      return (
                        <button
                          key={categoryKey}
                          onClick={() => handleCategoryClick(categoryKey)}
                          className="bg-white rounded-lg p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#4E74FF] transition-colors">
                            <Icon className="w-5 h-5 text-[#4E74FF] group-hover:text-white transition-colors" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1 font-plusjakarta">{category.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 font-plusjakarta">{category.description}</p>
                          <span className="text-sm text-[#4E74FF] font-medium font-plusjakarta">
                            {category.articles.length} articles
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Custom Styles for Article Content */}
      <style jsx global>{`
        .prose h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .prose h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .prose p {
          margin-bottom: 0.75rem;
          line-height: 1.7;
          color: #4B5563;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .prose ul, .prose ol {
          margin-bottom: 0.75rem;
          margin-left: 1.25rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .prose li {
          margin-bottom: 0.375rem;
          color: #4B5563;
          line-height: 1.6;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .prose strong {
          font-weight: 600;
          color: #111827;
        }

        .prose .tip-box {
          background-color: #ECFDF5;
          border-left: 4px solid #10B981;
          padding: 0.875rem 1rem;
          margin: 1rem 0;
          border-radius: 0.375rem;
        }

        .prose .warning-box {
          background-color: #FEF3C7;
          border-left: 4px solid #F59E0B;
          padding: 0.875rem 1rem;
          margin: 1rem 0;
          border-radius: 0.375rem;
        }
      `}</style>
    </div>
  );
};

export default HelpPageNew;
