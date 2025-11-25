import React from 'react';
import HelpArticle from './HelpArticle';
import { CheckCircle, AlertTriangle, Smartphone } from 'lucide-react';

const QRCodeBestPractices = () => {
  return (
    <HelpArticle
      title="QR Code Best Practices"
      description="Learn where and how to place QR codes for maximum engagement"
      category="QR Codes & Setup"
      categoryColor="green"
      readTime="6 min read"
      lastUpdated="January 2025"
    >
      <div className="space-y-8">

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center">
            <Smartphone className="w-6 h-6 mr-2 text-brand" />
            Why QR Code Placement Matters
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The location and presentation of your QR codes directly impacts response rates. A well-placed QR code
            can boost feedback collection by 300% compared to poorly positioned codes.
          </p>
          <div className="bg-green-50 border-l-4 border-brand p-6 rounded-r-xl">
            <p className="text-gray-700 font-semibold mb-2">
              Goal: 15-20% Response Rate
            </p>
            <p className="text-gray-600 text-sm">
              Most successful venues achieve 15-20% of customers scanning and leaving feedback with optimal placement.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Best Placement Locations</h2>

          <div className="space-y-6">

            {/* On Tables */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">On Tables (Restaurants)</h3>
                  <p className="text-gray-700 mb-4">
                    Table placement is most effective for restaurants and cafes.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Use table tents or stands (5-10cm tall)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Position near condiments or menus</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Ensure visible from both sides of the table</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Laminate to protect from spills</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* On Receipts */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">On Receipts</h3>
                  <p className="text-gray-700 mb-4">
                    Perfect for capturing feedback at checkout or bill payment.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Print QR code at bottom of receipts</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Add clear call-to-action text</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Minimum 2cm x 2cm size</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Works well with incentives ("Scan for 10% off next visit")</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Wall Displays */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">Wall Displays & Signage</h3>
                  <p className="text-gray-700 mb-4">
                    High-visibility placement for retail stores and hotels.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Place at eye level (150-170cm height)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Near exits or checkout counters</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Use larger size (10cm x 10cm or bigger)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Ensure good lighting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Digital Displays */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">Digital Screens & Tablets</h3>
                  <p className="text-gray-700 mb-4">
                    Modern, engaging way to collect feedback.
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Display QR code on customer-facing screens</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Rotate with promotional content</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Add animation to draw attention</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Works great in hotel lobbies and waiting areas</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Common Mistakes to Avoid</h2>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-2">Too Small to Scan</h4>
                  <p className="text-gray-700">
                    QR codes smaller than 2cm x 2cm are difficult to scan. Always prioritise readability over space-saving.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-2">Poor Lighting</h4>
                  <p className="text-gray-700">
                    Dark corners or dim lighting make QR codes hard to scan. Ensure adequate lighting or add backlit displays.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-2">Hidden or Obstructed</h4>
                  <p className="text-gray-700">
                    QR codes behind objects, menus, or in hard-to-reach places get ignored. Keep them visible and accessible.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-2">No Call-to-Action</h4>
                  <p className="text-gray-700">
                    A QR code alone isn't enough. Add text like "Scan to share your feedback" or "Tell us how we did!".
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-2">Damaged or Dirty Codes</h4>
                  <p className="text-gray-700">
                    Regularly check and replace worn-out QR codes. Laminate paper codes to protect from moisture and damage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">Size Guidelines</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-primary">Use Case</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-primary">Recommended Size</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-primary">Viewing Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-gray-700">Table tents</td>
                  <td className="px-6 py-4 text-gray-700">4cm x 4cm</td>
                  <td className="px-6 py-4 text-gray-700">30-50cm</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Receipts</td>
                  <td className="px-6 py-4 text-gray-700">2cm x 2cm (minimum)</td>
                  <td className="px-6 py-4 text-gray-700">20-30cm</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Wall posters</td>
                  <td className="px-6 py-4 text-gray-700">10cm x 10cm</td>
                  <td className="px-6 py-4 text-gray-700">1-2 meters</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Digital screens</td>
                  <td className="px-6 py-4 text-gray-700">15cm x 15cm</td>
                  <td className="px-6 py-4 text-gray-700">2-3 meters</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Window displays</td>
                  <td className="px-6 py-4 text-gray-700">20cm x 20cm</td>
                  <td className="px-6 py-4 text-gray-700">3-5 meters</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">Effective Call-to-Action Text</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-800 mb-3">Great Examples:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>"Share your feedback in 30 seconds"</li>
                <li>"How did we do today?"</li>
                <li>"Scan to tell us about your experience"</li>
                <li>"We'd love to hear from you!"</li>
                <li>"Help us improve - quick feedback"</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="font-semibold text-red-800 mb-3">Avoid These:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>"QR Code" (too vague)</li>
                <li>"Scan here" (doesn't explain why)</li>
                <li>"Survey" (sounds like work)</li>
                <li>"Feedback form" (too formal)</li>
                <li>No text at all</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">Success Metrics</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <p className="text-gray-700 mb-4">
              Track these metrics to optimize your QR code placement:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Scan Rate:</strong> Percentage of customers who scan the QR code</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Completion Rate:</strong> Percentage who complete the feedback after scanning</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Time to Scan:</strong> When during the visit customers typically scan</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Location Performance:</strong> Which QR code locations get the most scans</span>
              </li>
            </ul>
          </div>
        </section>

      </div>
    </HelpArticle>
  );
};

export default QRCodeBestPractices;
