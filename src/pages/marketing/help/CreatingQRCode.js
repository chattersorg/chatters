import React from 'react';
import HelpArticle from './HelpArticle';
import { CheckCircle, QrCode, Download, Printer, Smartphone, AlertTriangle } from 'lucide-react';

const CreatingQRCode = () => {
  return (
    <HelpArticle
      title="Creating Your QR Code"
      description="Generate and deploy your first feedback QR code"
      category="Getting Started"
      categoryColor="blue"
      readTime="7 min read"
      lastUpdated="January 2025"
    >
      <div className="space-y-8">

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center">
            <QrCode className="w-6 h-6 mr-2 text-brand" />
            What is a Feedback QR Code?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Your QR code is the gateway for customers to leave feedback. When scanned with a smartphone camera,
            it instantly opens your custom feedback form - no app download required.
          </p>
          <div className="bg-blue-50 border-l-4 border-brand p-6 rounded-r-xl">
            <p className="text-gray-700 font-semibold mb-2">
              Why QR Codes Work:
            </p>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>• Takes only 2-3 seconds for customers to scan</li>
              <li>• No app download or account creation needed</li>
              <li>• Works on all modern smartphones (iOS & Android)</li>
              <li>• Can be placed anywhere - tables, receipts, walls, digital screens</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Step 1: Access QR Code Generator</h2>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-primary mb-4">Navigate to QR Codes</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">1.</span>
                <span>Log into your dashboard at <span className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">my.getchatters.com</span></span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">2.</span>
                <span>Click <strong>QR Codes</strong> in the left sidebar</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">3.</span>
                <span>Select your venue from the dropdown (if you have multiple)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3 min-w-[24px]">4.</span>
                <span>Click the <strong className="text-brand">"Generate QR Code"</strong> button</span>
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Step 2: Customise Your QR Code</h2>

          <div className="space-y-6">

            {/* QR Code Style */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-3 text-lg">Choose Your Style</h4>
              <p className="text-gray-700 mb-4">
                Select a QR code style that matches your venue's aesthetic.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="border-2 border-gray-200 rounded-lg p-4 text-center hover:border-brand transition-colors cursor-pointer">
                  <div className="w-32 h-32 bg-gray-100 rounded mx-auto mb-3 flex items-center justify-center">
                    <div className="w-24 h-24 bg-black"></div>
                  </div>
                  <p className="font-semibold text-primary">Classic</p>
                  <p className="text-xs text-gray-600">Standard black & white</p>
                </div>

                <div className="border-2 border-brand rounded-lg p-4 text-center">
                  <div className="w-32 h-32 bg-gray-100 rounded mx-auto mb-3 flex items-center justify-center">
                    <div className="w-24 h-24 bg-green-600"></div>
                  </div>
                  <p className="font-semibold text-brand">Branded</p>
                  <p className="text-xs text-gray-600">Uses your brand color</p>
                </div>

                <div className="border-2 border-gray-200 rounded-lg p-4 text-center hover:border-brand transition-colors cursor-pointer">
                  <div className="w-32 h-32 bg-gray-100 rounded mx-auto mb-3 flex items-center justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
                  </div>
                  <p className="font-semibold text-primary">Gradient</p>
                  <p className="text-xs text-gray-600">Modern color fade</p>
                </div>
              </div>
            </div>

            {/* Logo Integration */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-3 text-lg">Add Your Logo (Optional)</h4>
              <p className="text-gray-700 mb-4">
                Place your venue logo in the center of the QR code for brand recognition.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-800 mb-1">Important:</p>
                    <p className="text-sm text-gray-700">
                      Your logo will cover approximately 20% of the QR code center. Test scanning after adding to ensure it still works.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <input type="checkbox" className="w-5 h-5 text-brand rounded" />
                <label className="text-gray-700">Include venue logo in QR code</label>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-3 text-lg">Add a Call-to-Action</h4>
              <p className="text-gray-700 mb-4">
                Include text above or below the QR code to encourage scanning.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-800 mb-3">Great Examples:</h5>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>"Scan to share your feedback"</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>"How did we do today?"</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>"Quick 30-second survey"</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>"Help us improve - scan here"</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-semibold text-red-800 mb-3">Avoid These:</h5>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• "QR Code" (obvious & boring)</li>
                    <li>• "Scan here" (doesn't explain why)</li>
                    <li>• "Survey" (sounds like work)</li>
                    <li>• Long paragraphs of text</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Download className="w-6 h-6 mr-2 text-brand" />
            Step 3: Download Your QR Code
          </h2>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
            <h4 className="font-semibold text-primary mb-4 text-lg">Choose Download Format</h4>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h5 className="font-semibold text-primary mb-2">PNG (Standard)</h5>
                <p className="text-xs text-gray-600 mb-3">Best for: Printing, digital displays</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• High resolution (300 DPI)</li>
                  <li>• Transparent background option</li>
                  <li>• Works with all printers</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-2 border-brand">
                <h5 className="font-semibold text-brand mb-2">SVG (Vector)</h5>
                <p className="text-xs text-gray-600 mb-3">Best for: Large prints, professional design</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Scales infinitely without blur</li>
                  <li>• Perfect for banners & posters</li>
                  <li>• Editable in design software</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h5 className="font-semibold text-primary mb-2">PDF</h5>
                <p className="text-xs text-gray-600 mb-3">Best for: Table tents, standees</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Print-ready format</li>
                  <li>• Includes bleed and trim marks</li>
                  <li>• Pre-sized templates</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Recommendation:</strong> Download both PNG and SVG formats. Use PNG for quick prints and SVG for large-scale printing or professional design work.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <h4 className="font-semibold text-primary mb-4 text-lg">Size Guidelines</h4>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Use Case</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Minimum Size</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Recommended Size</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Scan Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-gray-700">Table tent</td>
                    <td className="px-4 py-3 text-gray-700">3cm x 3cm</td>
                    <td className="px-4 py-3 text-gray-700">5cm x 5cm</td>
                    <td className="px-4 py-3 text-gray-700">30-50cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-700">Receipt</td>
                    <td className="px-4 py-3 text-gray-700">2cm x 2cm</td>
                    <td className="px-4 py-3 text-gray-700">3cm x 3cm</td>
                    <td className="px-4 py-3 text-gray-700">20-30cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-700">Wall poster</td>
                    <td className="px-4 py-3 text-gray-700">8cm x 8cm</td>
                    <td className="px-4 py-3 text-gray-700">15cm x 15cm</td>
                    <td className="px-4 py-3 text-gray-700">1-2 meters</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-700">Digital screen</td>
                    <td className="px-4 py-3 text-gray-700">10cm x 10cm</td>
                    <td className="px-4 py-3 text-gray-700">20cm x 20cm</td>
                    <td className="px-4 py-3 text-gray-700">1-3 meters</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-700">Window display</td>
                    <td className="px-4 py-3 text-gray-700">15cm x 15cm</td>
                    <td className="px-4 py-3 text-gray-700">30cm x 30cm</td>
                    <td className="px-4 py-3 text-gray-700">2-5 meters</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Printer className="w-6 h-6 mr-2 text-brand" />
            Step 4: Print Your QR Code
          </h2>

          <div className="space-y-6">

            {/* Printing Options */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-4 text-lg">Printing Options</h4>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-semibold text-brand mb-2">Home/Office Printer</h5>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Quick and convenient for small quantities</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Use cardstock (200-300gsm) for durability</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Laminate for spill protection</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Cost: Under £1 per QR code</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h5 className="font-semibold text-brand mb-2">Professional Print Shop</h5>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Best quality for customer-facing materials</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Various materials: acrylic, metal, wood</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Large format options for walls/windows</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Cost: £5-50+ depending on size/material</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Print Quality Checklist */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
              <h4 className="font-semibold text-yellow-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Pre-Print Checklist
              </h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                  <span className="ml-3">QR code is at least 2cm x 2cm in size</span>
                </li>
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                  <span className="ml-3">High contrast (dark code on light background)</span>
                </li>
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                  <span className="ml-3">Tested scanning on your phone before printing</span>
                </li>
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                  <span className="ml-3">Call-to-action text is clear and visible</span>
                </li>
                <li className="flex items-start">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                  <span className="ml-3">No important information is cut off</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Smartphone className="w-6 h-6 mr-2 text-brand" />
            Step 5: Test Before Deploying
          </h2>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8 border-2 border-orange-300">
            <h4 className="font-semibold text-orange-900 mb-4 text-lg">Critical: Always Test First!</h4>
            <p className="text-gray-700 mb-6">
              Before placing your QR codes in your venue, test them thoroughly to ensure a smooth customer experience.
            </p>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-semibold text-primary mb-2">Testing Checklist:</h5>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold text-brand mr-3 min-w-[24px]">1.</span>
                    <span><strong>Scan with multiple devices:</strong> Test with both iPhone and Android phones</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-brand mr-3 min-w-[24px]">2.</span>
                    <span><strong>Check lighting conditions:</strong> Test in bright and dim lighting</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-brand mr-3 min-w-[24px]">3.</span>
                    <span><strong>Complete full feedback flow:</strong> Submit a test response</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-brand mr-3 min-w-[24px]">4.</span>
                    <span><strong>Verify feedback appears:</strong> Check your dashboard for the test submission</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-brand mr-3 min-w-[24px]">5.</span>
                    <span><strong>Test from different distances:</strong> Ensure it scans from the expected range</span>
                  </li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Pro Tip:</strong> Ask 2-3 staff members to test with their personal phones. Different phone models can have varying camera capabilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">Troubleshooting QR Codes</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-2">QR code won't scan?</h4>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Increase size - try printing 50% larger</li>
                <li>• Ensure high contrast (avoid colored backgrounds)</li>
                <li>• Check for smudges or damage on printed code</li>
                <li>• Remove logo if included - it may be blocking too much</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-2">Code scans but page doesn't load?</h4>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• Check your internet connection</li>
                <li>• Verify venue is active in settings</li>
                <li>• Try regenerating the QR code</li>
                <li>• Contact support if issue persists</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary mb-2">Need a new QR code?</h4>
              <p className="text-gray-700 text-sm">
                You can regenerate your QR code anytime from the dashboard. Old codes continue working unless you explicitly deactivate them.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">Next Steps</h2>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <p className="text-gray-700 mb-4">
              Your QR code is ready! Now it's time to:
            </p>
            <div className="space-y-3">
              <a href="/help/qr-code-best-practices" className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <span className="font-semibold text-primary">Learn QR code placement best practices</span>
                </div>
                <span className="text-brand group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a href="/help/testing-system" className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <span className="font-semibold text-primary">Complete system testing</span>
                </div>
                <span className="text-brand group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a href="/help/understanding-kiosk-mode" className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <span className="font-semibold text-primary">Set up Kiosk Mode for real-time monitoring</span>
                </div>
                <span className="text-brand group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          </div>
        </section>

      </div>
    </HelpArticle>
  );
};

export default CreatingQRCode;
