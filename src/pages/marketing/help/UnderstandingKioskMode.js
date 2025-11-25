import React from 'react';
import HelpArticle from './HelpArticle';
import { MessageSquare, Monitor, Bell } from 'lucide-react';

const UnderstandingKioskMode = () => {
  return (
    <HelpArticle
      title="Understanding Kiosk Mode"
      description="Your real-time dashboard for customer feedback and alerts"
      category="Kiosk Mode"
      categoryColor="purple"
      readTime="7 min read"
      lastUpdated="January 2025"
    >
      <div className="space-y-8">

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center">
            <Monitor className="w-6 h-6 mr-2 text-brand" />
            What is Kiosk Mode?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Kiosk Mode is your real-time command center for customer feedback. It's designed to be displayed
            on a tablet, TV screen, or computer in your staff area, giving your team instant visibility into
            customer experiences as they happen.
          </p>
          <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-r-xl">
            <p className="text-gray-700 font-semibold mb-2">
              The Power of Real-Time Response
            </p>
            <p className="text-gray-600 text-sm">
              Studies show that addressing customer concerns within 5 minutes can turn a negative experience
              into a positive one 85% of the time. Kiosk Mode makes this possible.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Key Features</h2>

          <div className="space-y-6">

            {/* Real-Time Alerts */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">Real-Time Alerts</h3>
                  <p className="text-gray-700 mb-4">
                    Instant notifications when customers leave feedback or request assistance.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <div>
                        <span className="font-semibold text-gray-900">Red Alerts:</span>
                        <span className="text-gray-600 ml-2">Low ratings (1-2 stars) - urgent action required</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <div>
                        <span className="font-semibold text-gray-900">Yellow Alerts:</span>
                        <span className="text-gray-600 ml-2">Medium ratings with comments - needs attention</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <div>
                        <span className="font-semibold text-gray-900">Blue Alerts:</span>
                        <span className="text-gray-600 ml-2">General feedback - review when convenient</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      <div>
                        <span className="font-semibold text-gray-900">Orange Alerts:</span>
                        <span className="text-gray-600 ml-2">Assistance requests - respond within 2 minutes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Floor Plan */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">Visual Floor Plan</h3>
                  <p className="text-gray-700 mb-4">
                    See which tables need attention at a glance with colour-coded indicators.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-6 h-6 bg-red-500 rounded"></div>
                      <span className="text-gray-700 text-sm">Red tables: Urgent issues</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                      <span className="text-gray-700 text-sm">Yellow: Needs attention</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-6 h-6 bg-green-500 rounded"></div>
                      <span className="text-gray-700 text-sm">Green: Positive feedback</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-6 h-6 bg-gray-400 rounded"></div>
                      <span className="text-gray-700 text-sm">Gray: No recent activity</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Details */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-primary mb-3">Detailed Feedback View</h3>
              <p className="text-gray-700 mb-4">
                Click any alert to see the complete feedback including:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Table number and timestamp</li>
                <li>• Star ratings for each question</li>
                <li>• Customer comments and suggestions</li>
                <li>• Staff member assigned (if applicable)</li>
                <li>• Resolution status and notes</li>
              </ul>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Setting Up Kiosk Mode</h2>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-4 text-lg">Step 1: Choose Your Display Device</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-primary mb-2">Tablet</h5>
                  <p className="text-sm text-gray-600">iPad or Android tablet mounted in staff area</p>
                  <p className="text-xs text-gray-500 mt-2">Best for: Small venues, mobile staff</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-primary mb-2">TV Screen</h5>
                  <p className="text-sm text-gray-600">Large display visible to entire team</p>
                  <p className="text-xs text-gray-500 mt-2">Best for: Kitchens, back-of-house areas</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-primary mb-2">Computer Monitor</h5>
                  <p className="text-sm text-gray-600">Desktop setup at host stand or manager desk</p>
                  <p className="text-xs text-gray-500 mt-2">Best for: Manager stations, reception</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-4 text-lg">Step 2: Access Kiosk Mode</h4>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold text-brand mr-3">1.</span>
                  <span>Navigate to <span className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">my.getchatters.com/kiosk</span></span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-brand mr-3">2.</span>
                  <span>Log in with your Chatters credentials</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-brand mr-3">3.</span>
                  <span>Select your venue from the dropdown</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-brand mr-3">4.</span>
                  <span>Click the fullscreen button for optimal viewing</span>
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-4 text-lg">Step 3: Configure Settings</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Set notification sounds and volume</li>
                <li>• Adjust alert priorities and thresholds</li>
                <li>• Configure auto-refresh interval (recommended: 10 seconds)</li>
                <li>• Set up your floor plan layout (optional)</li>
                <li>• Enable/disable specific alert types</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Staff Training Best Practices</h2>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <h4 className="font-semibold text-primary mb-4">Essential Training Topics</h4>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</div>
                <div>
                  <p className="font-semibold">Understanding Alert Colours</p>
                  <p className="text-sm text-gray-600">Train staff on what each colour means and appropriate response times</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</div>
                <div>
                  <p className="font-semibold">Response Protocols</p>
                  <p className="text-sm text-gray-600">Establish clear procedures for each alert type</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold">Resolving Feedback</p>
                  <p className="text-sm text-gray-600">How to mark issues as resolved and add resolution notes</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">4</div>
                <div>
                  <p className="font-semibold">Communication</p>
                  <p className="text-sm text-gray-600">Team coordination when multiple staff members are working</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-primary mb-3">Recommended Response Times</h4>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between items-center bg-white rounded-lg p-3">
                <span className="font-semibold">Red Alerts (Urgent Issues)</span>
                <span className="text-red-600 font-bold">Under 5 minutes</span>
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg p-3">
                <span className="font-semibold">Orange Alerts (Assistance)</span>
                <span className="text-orange-600 font-bold">Under 2 minutes</span>
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg p-3">
                <span className="font-semibold">Yellow Alerts (Attention)</span>
                <span className="text-yellow-600 font-bold">Under 10 minutes</span>
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg p-3">
                <span className="font-semibold">Blue Alerts (General)</span>
                <span className="text-blue-600 font-bold">End of service/shift</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">Troubleshooting</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-2">Kiosk not updating in real-time?</h4>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Check your internet connection</li>
                <li>• Refresh the browser page (F5)</li>
                <li>• Ensure auto-refresh is enabled in settings</li>
                <li>• Try logging out and back in</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-2">Alerts not showing sound notifications?</h4>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Check device volume is turned up</li>
                <li>• Ensure notification sounds are enabled in kiosk settings</li>
                <li>• Browser may be blocking audio - click to allow</li>
                <li>• Test with a different browser (Chrome recommended)</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-2">Floor plan not displaying correctly?</h4>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Verify tables are configured in venue settings</li>
                <li>• Check floor plan layout is saved</li>
                <li>• Clear browser cache and reload</li>
                <li>• Contact support for custom floor plan assistance</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">Pro Tips</h2>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-2xl mr-3">💡</span>
                <span><strong>Keep it visible:</strong> Position the kiosk display where staff naturally look throughout their shift</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">⚡</span>
                <span><strong>Assign ownership:</strong> Designate a "kiosk monitor" role during each shift for accountability</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">🎯</span>
                <span><strong>Review daily:</strong> Hold 5-minute team meetings to review feedback patterns and celebrate wins</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">📊</span>
                <span><strong>Track metrics:</strong> Monitor response times and resolution rates to improve team performance</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">🔄</span>
                <span><strong>Iterate:</strong> Adjust alert thresholds based on your venue's specific needs and volume</span>
              </li>
            </ul>
          </div>
        </section>

      </div>
    </HelpArticle>
  );
};

export default UnderstandingKioskMode;
