import React from 'react';
import HelpArticle from './HelpArticle';
import { CheckCircle, Play } from 'lucide-react';

const QuickStartGuide = () => {
  return (
    <HelpArticle
      title="Quick Start Guide"
      description="Get up and running with Chatters in under 10 minutes"
      category="Getting Started"
      categoryColor="blue"
      readTime="8 min read"
      lastUpdated="January 2025"
    >
      <div className="space-y-8">

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center">
            <Play className="w-6 h-6 mr-2 text-brand" />
            Welcome to Chatters
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Chatters is designed to get you collecting valuable customer feedback in minutes, not hours.
            This guide will walk you through the essential steps to launch your feedback system today.
          </p>
          <div className="bg-blue-50 border-l-4 border-brand p-6 rounded-r-xl">
            <p className="text-gray-700 font-semibold">
              Time required: 10-15 minutes
            </p>
            <p className="text-gray-600 text-sm mt-2">
              By the end of this guide, you'll have your QR codes ready and your first feedback flowing in.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Step-by-Step Setup</h2>

          <div className="space-y-6">

            {/* Step 1 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center text-lg font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">Create Your Account</h3>
                  <p className="text-gray-700 mb-4">
                    Sign up at <a href="https://my.getchatters.com" className="text-brand hover:underline">my.getchatters.com</a> with your email address.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Enter your business email</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Choose a secure password</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Verify your email address</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center text-lg font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">Set Up Your First Venue</h3>
                  <p className="text-gray-700 mb-4">
                    Add your venue details to personalise the feedback experience.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Navigate to Settings → Venue Settings</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Enter venue name, address, and contact details</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Upload your logo (optional but recommended)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Set your brand colors</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center text-lg font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">Create Your Questions</h3>
                  <p className="text-gray-700 mb-4">
                    Start simple with 2-3 questions about key aspects of your service.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                    <p className="font-semibold text-primary mb-2">Recommended starter questions:</p>
                    <ul className="space-y-2 text-gray-700">
                      <li>1. "How was your food quality?" (1-5 stars)</li>
                      <li>2. "How was our service?" (1-5 stars)</li>
                      <li>3. "Would you recommend us?" (Yes/No)</li>
                    </ul>
                  </div>
                  <p className="text-gray-600 text-sm">
                    <strong>Pro tip:</strong> Keep questions clear and simple. You can add more sophisticated questions later.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center text-lg font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">Generate Your QR Code</h3>
                  <p className="text-gray-700 mb-4">
                    Create and download your unique QR code for customers to scan.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Go to QR Codes section in dashboard</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Click "Generate QR Code"</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Download in high-resolution format</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Print at minimum 2cm x 2cm size</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center text-lg font-bold">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">Test Your System</h3>
                  <p className="text-gray-700 mb-4">
                    Before going live, test the complete customer journey.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Scan your QR code with your phone</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Complete a test feedback submission</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Check feedback appears in your dashboard</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Test kiosk mode on a tablet or display</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">You're All Set!</h2>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-gray-700 mb-4">
              Congratulations! Your Chatters feedback system is now live and ready to collect customer insights.
            </p>
            <p className="text-gray-700 font-semibold mb-4">
              Next steps:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Place QR codes on tables or at checkout</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Train your staff on responding to feedback</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Set up kiosk mode for real-time monitoring</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Explore analytics to track performance</span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">Common Questions</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-2">How long does setup really take?</h4>
              <p className="text-gray-700">
                Most customers complete basic setup in 10-15 minutes. Adding advanced features like floor plans or multiple venues takes longer.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-2">Do I need technical skills?</h4>
              <p className="text-gray-700">
                No! Chatters is designed to be intuitive. If you can use email and browse the web, you can set up Chatters.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-2">What if I get stuck?</h4>
              <p className="text-gray-700">
                Our support team is here to help! Contact us via live chat, email, or schedule an onboarding call.
              </p>
            </div>
          </div>
        </section>

      </div>
    </HelpArticle>
  );
};

export default QuickStartGuide;
