import React from 'react';
import HelpArticle from './HelpArticle';
import { CheckCircle, TestTube, Smartphone, Monitor, Users, AlertTriangle, Play } from 'lucide-react';

const TestingSystem = () => {
  return (
    <HelpArticle
      title="Testing Your System"
      description="How to properly test your feedback system before going live"
      category="Getting Started"
      categoryColor="blue"
      readTime="9 min read"
      lastUpdated="January 2025"
    >
      <div className="space-y-8">

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center">
            <TestTube className="w-6 h-6 mr-2 text-brand" />
            Why Testing is Critical
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Testing your Chatters system before going live ensures a smooth experience for both customers and staff.
            A properly tested system prevents confusion, technical issues, and missed feedback during your first few days of operation.
          </p>
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
            <p className="text-gray-700 font-semibold mb-2">
              What happens without proper testing:
            </p>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>• Customers scan QR codes that don't work</li>
              <li>• Staff miss urgent feedback alerts</li>
              <li>• Questions appear confusing or broken</li>
              <li>• Kiosk mode doesn't update in real-time</li>
              <li>• First impressions are negative</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Complete Testing Checklist</h2>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-300 mb-8">
            <h3 className="text-xl font-bold text-primary mb-4">5-Step Testing Process</h3>
            <p className="text-gray-700 mb-6">
              Follow this sequence to ensure every component of your system works correctly:
            </p>

            <div className="space-y-4">
              {[
                { num: 1, title: "Test Customer Feedback Flow", time: "5-10 minutes" },
                { num: 2, title: "Verify Dashboard & Analytics", time: "3-5 minutes" },
                { num: 3, title: "Test Kiosk Mode", time: "5-10 minutes" },
                { num: 4, title: "Test Assistance Requests", time: "3-5 minutes" },
                { num: 5, title: "Team Training & Walkthrough", time: "15-20 minutes" }
              ].map((step) => (
                <div key={step.num} className="bg-white rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {step.num}
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{step.title}</p>
                      <p className="text-xs text-gray-600">{step.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Total Time:</strong> 30-50 minutes for complete system testing
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Smartphone className="w-6 h-6 mr-2 text-brand" />
            Test 1: Customer Feedback Flow
          </h2>

          <div className="space-y-6">

            {/* Step 1 */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-4 text-lg">Step 1: Scan Your QR Code</h4>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h5 className="font-semibold text-brand mb-3">Test on iPhone:</h5>
                  <ol className="space-y-2 text-gray-700 text-sm">
                    <li>1. Open native Camera app</li>
                    <li>2. Point at QR code</li>
                    <li>3. Tap notification banner</li>
                    <li>4. Feedback form should load instantly</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-semibold text-brand mb-3">Test on Android:</h5>
                  <ol className="space-y-2 text-gray-700 text-sm">
                    <li>1. Open Camera or Google Lens</li>
                    <li>2. Point at QR code</li>
                    <li>3. Tap popup link</li>
                    <li>4. Feedback form should load instantly</li>
                  </ol>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-800 mb-1">Common Issue:</p>
                    <p className="text-sm text-gray-700">
                      If QR code doesn't scan, it may be too small. Minimum size is 2cm x 2cm. Try increasing size by 50%.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-4 text-lg">Step 2: Complete Feedback Form</h4>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-primary mb-3">What to Check:</h5>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Venue logo displays correctly</strong> - Check size, position, clarity</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Questions appear in correct order</strong> - No duplicates or missing questions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Rating scales work properly</strong> - Stars, numbers, or emoji selectors</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Text input fields function</strong> - Comments boxes accept typing</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Table number selector works</strong> - Dropdown or manual entry</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Submit button is visible and active</strong> - No scrolling required</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Pro Tip:</strong> Submit 3 test responses - one positive (5 stars), one neutral (3 stars), and one negative (1-2 stars) to test all alert types.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-4 text-lg">Step 3: Confirm Thank You Page</h4>

              <p className="text-gray-700 mb-4">
                After submitting, customers should see a confirmation message.
              </p>

              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-primary mb-3">Verify These Elements:</h5>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                    <span>Clear "Thank you" message appears</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                    <span>Option to submit another response (for next customer)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                    <span>Social media links (if enabled)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                    <span>No error messages or blank screens</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Monitor className="w-6 h-6 mr-2 text-brand" />
            Test 2: Dashboard & Analytics
          </h2>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
            <h4 className="font-semibold text-primary mb-4 text-lg">Verify Feedback Appears</h4>

            <ol className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">1.</span>
                <div className="flex-1">
                  <p className="font-semibold mb-2">Open your dashboard</p>
                  <p className="text-sm text-gray-600">Navigate to <span className="bg-gray-100 px-2 py-1 rounded font-mono">my.getchatters.com</span></p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">2.</span>
                <div className="flex-1">
                  <p className="font-semibold mb-2">Check Recent Feedback section</p>
                  <p className="text-sm text-gray-600">Your test responses should appear within 5-10 seconds</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">3.</span>
                <div className="flex-1">
                  <p className="font-semibold mb-2">Verify all details are correct</p>
                  <div className="mt-2 bg-gray-50 rounded p-3">
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Table number matches what you entered</li>
                      <li>• Timestamp is accurate</li>
                      <li>• Star ratings display correctly</li>
                      <li>• Comments appear in full (not truncated)</li>
                      <li>• Alert colours match ratings (red for 1-2 stars, etc.)</li>
                    </ul>
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">4.</span>
                <div className="flex-1">
                  <p className="font-semibold mb-2">Test filtering and search</p>
                  <p className="text-sm text-gray-600">Filter by date, rating, table number - ensure all filters work</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <h4 className="font-semibold text-primary mb-4 text-lg">Check Analytics</h4>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-primary mb-2">Metrics to Verify:</h5>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Total feedback count increased</li>
                  <li>• Average rating updated</li>
                  <li>• Response rate calculated</li>
                  <li>• Charts show new data points</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-primary mb-2">Export Test:</h5>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Try exporting to CSV</li>
                  <li>• Verify all columns populate</li>
                  <li>• Check data accuracy</li>
                  <li>• Confirm date ranges work</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Monitor className="w-6 h-6 mr-2 text-brand" />
            Test 3: Kiosk Mode
          </h2>

          <div className="space-y-6">

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-4 text-lg">Setup Kiosk Display</h4>

              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold text-brand mr-3">1.</span>
                  <span>Open Kiosk Mode on tablet/screen: <span className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">my.getchatters.com/kiosk</span></span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-brand mr-3">2.</span>
                  <span>Log in with your credentials</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-brand mr-3">3.</span>
                  <span>Select your venue from dropdown</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-brand mr-3">4.</span>
                  <span>Enable fullscreen mode for best visibility</span>
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-4 text-lg">Test Real-Time Updates</h4>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Test Process:</strong> Have Kiosk Mode open on one device while submitting feedback on another phone.
                </p>
                <p className="text-xs text-gray-600">
                  You should see the feedback appear in Kiosk Mode within 5-10 seconds of submission.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-primary mb-3">What to Verify:</h5>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>New feedback appears automatically (no manual refresh needed)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Alert colours match severity (red for urgent, yellow for moderate, blue for info)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Sound notification plays (if enabled)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Table numbers display on floor plan (if configured)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Clicking feedback shows full details in modal</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Can mark feedback as "Resolved" or "Acknowledged"</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Test 4: Assistance Requests</h2>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
            <h4 className="font-semibold text-primary mb-4 text-lg">Submit Test Assistance Request</h4>

            <ol className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">1.</span>
                <div className="flex-1">
                  <p>Scan QR code on your phone</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">2.</span>
                <div className="flex-1">
                  <p>Enter table number</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">3.</span>
                <div className="flex-1">
                  <p>Click <strong>"Just need assistance?"</strong> button instead of answering questions</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">4.</span>
                <div className="flex-1">
                  <p>Submit the assistance request</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <h4 className="font-semibold text-primary mb-4 text-lg">Verify in Kiosk Mode</h4>

            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
              <h5 className="font-semibold text-orange-800 mb-3">Should Appear As Orange Alert</h5>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Shows at top of alert list (high priority)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Displays table number clearly</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Shows timestamp of request</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Can be acknowledged and resolved</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Sound alert plays (if enabled)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-brand" />
            Test 5: Team Training & Walkthrough
          </h2>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border-2 border-green-300">
            <h4 className="font-semibold text-primary mb-4 text-lg">Staff Training Checklist</h4>
            <p className="text-gray-700 mb-6">
              Before going live, ensure all staff members understand how to use Chatters.
            </p>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <h5 className="font-semibold text-brand mb-4">Customer-Facing Staff Should Know:</h5>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>Where QR codes are located</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>How to encourage customers to scan ("Takes only 30 seconds!")</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>How to help customers who have scanning issues</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>Assistance request feature for quick help</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6">
                <h5 className="font-semibold text-brand mb-4">All Staff Should Know:</h5>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>How to access and read Kiosk Mode</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>What different alert colours mean (red = urgent, orange = assistance, etc.)</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>Target response times for each alert type</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>How to acknowledge and resolve feedback</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>Who to contact if technical issues arise</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6">
                <h5 className="font-semibold text-brand mb-4">Managers Should Know:</h5>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>How to access full dashboard and analytics</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>How to export feedback data for review</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>How to update questions and settings</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>How to generate new QR codes</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">✓</div>
                    <span>Chatters support contact information</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Pre-Launch Final Check</h2>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-purple-300">
            <h4 className="font-semibold text-primary mb-6 text-lg">Complete This Before Going Live:</h4>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-6 h-6 text-brand rounded" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">All QR codes tested and scanning properly</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-6 h-6 text-brand rounded" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">Feedback appears in dashboard within 10 seconds</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-6 h-6 text-brand rounded" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">Kiosk Mode updates in real-time</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-6 h-6 text-brand rounded" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">Assistance requests work and appear as orange alerts</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-6 h-6 text-brand rounded" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">All staff trained on basic operations</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-6 h-6 text-brand rounded" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">Kiosk display positioned where staff can see it</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-6 h-6 text-brand rounded" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">QR codes placed in high-visibility locations</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-6 h-6 text-brand rounded" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">Test data cleared from dashboard (optional)</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-6 h-6 text-brand rounded" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">Support contact information saved by managers</span>
              </label>
            </div>

            <div className="mt-8 pt-8 border-t border-purple-200">
              <div className="flex items-center justify-center space-x-3">
                <Play className="w-8 h-8 text-brand" />
                <p className="text-xl font-bold text-primary">
                  You're ready to launch!
                </p>
              </div>
              <p className="text-center text-gray-700 mt-3">
                Your Chatters feedback system is fully tested and ready for customers.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">First Week Best Practices</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-3">Day 1-2:</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Monitor Kiosk Mode constantly</li>
                <li>• Respond to ALL feedback within 5 minutes</li>
                <li>• Check QR code placement effectiveness</li>
                <li>• Note any customer questions or confusion</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-3">Day 3-7:</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Review response rates and patterns</li>
                <li>• Adjust QR code placement if needed</li>
                <li>• Train staff on recurring issues</li>
                <li>• Celebrate positive feedback with team</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-sm text-gray-700">
              <strong>Remember:</strong> The first week is a learning period. Small adjustments based on real-world use will optimize your system for long-term success.
            </p>
          </div>
        </section>

      </div>
    </HelpArticle>
  );
};

export default TestingSystem;
