import React from 'react';
import HelpArticle from './HelpArticle';
import { CheckCircle, Building2, Upload, Palette, MapPin } from 'lucide-react';

const SettingUpFirstVenue = () => {
  return (
    <HelpArticle
      title="Setting Up Your First Venue"
      description="Step-by-step guide to creating and configuring your venue"
      category="Getting Started"
      categoryColor="blue"
      readTime="10 min read"
      lastUpdated="January 2025"
    >
      <div className="space-y-8">

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-brand" />
            Why Venue Setup Matters
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Your venue is the foundation of your Chatters experience. A properly configured venue ensures
            accurate feedback collection, professional branding, and smooth operations for your team.
          </p>
          <div className="bg-blue-50 border-l-4 border-brand p-6 rounded-r-xl">
            <p className="text-gray-700 font-semibold mb-2">
              What you'll accomplish:
            </p>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>• Create your venue profile with all essential details</li>
              <li>• Upload your logo and set brand colors</li>
              <li>• Configure operating hours and feedback settings</li>
              <li>• Set up your floor plan (optional)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Step 1: Access Venue Settings</h2>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
            <h3 className="text-xl font-bold text-primary mb-4">Navigate to Settings</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3">1.</span>
                <span>Log into your Chatters dashboard at <span className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">my.getchatters.com</span></span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3">2.</span>
                <span>Click the <strong>Settings</strong> icon in the left sidebar</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-brand mr-3">3.</span>
                <span>Select <strong>Venue Settings</strong> from the menu</span>
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-brand" />
            Step 2: Basic Venue Information
          </h2>

          <div className="space-y-6">

            {/* Venue Name */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-3 text-lg">Venue Name</h4>
              <p className="text-gray-700 mb-4">
                Choose a clear, recognizable name for your venue. This appears on feedback forms and reports.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Good Examples:
                  </h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• "The Blue Bistro"</li>
                    <li>• "Downtown Grand Hotel"</li>
                    <li>• "Maple Street Cafe"</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-semibold text-red-800 mb-2">Avoid:</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Abbreviations: "BB" or "DSH"</li>
                    <li>• Generic: "Restaurant 1"</li>
                    <li>• Internal codes: "LOC-2401"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-3 text-lg">Contact Information</h4>
              <p className="text-gray-700 mb-4">
                Provide accurate contact details for customer inquiries and support.
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-primary mb-2">Required Fields:</h5>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Email Address:</strong> Main contact email for the venue
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Phone Number:</strong> Customer service or reservations line
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Address:</strong> Full street address including postcode
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Venue Type */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-3 text-lg">Venue Type</h4>
              <p className="text-gray-700 mb-4">
                Select your venue type to customise your experience and question templates.
              </p>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="font-semibold text-primary">Restaurant</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="font-semibold text-primary">Hotel</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="font-semibold text-primary">Cafe</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="font-semibold text-primary">Retail</p>
                </div>
              </div>
            </div>

            {/* Capacity & Tables */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h4 className="font-semibold text-primary mb-3 text-lg">Capacity & Tables</h4>
              <p className="text-gray-700 mb-4">
                Configure your venue capacity for better analytics and floor plan setup.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block font-semibold text-primary mb-2">Number of Tables</label>
                  <p className="text-sm text-gray-600 mb-3">
                    Total table count in your venue. You can add individual table details later.
                  </p>
                  <div className="bg-white rounded border border-gray-300 px-4 py-2">
                    <span className="text-gray-400">e.g., 25 tables</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block font-semibold text-primary mb-2">Total Capacity</label>
                  <p className="text-sm text-gray-600 mb-3">
                    Maximum number of guests your venue can serve.
                  </p>
                  <div className="bg-white rounded border border-gray-300 px-4 py-2">
                    <span className="text-gray-400">e.g., 80 guests</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Palette className="w-6 h-6 mr-2 text-brand" />
            Step 3: Branding Your Venue
          </h2>

          {/* Combined Branding Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">

            {/* Logo Upload Section */}
            <div className="mb-6 pb-6 border-b border-purple-200">
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-2 text-lg">Upload Your Logo</h4>
                  <p className="text-gray-700 text-sm">
                    Your logo appears on feedback forms, QR codes, and customer-facing materials.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-purple-200">
                  <h5 className="font-semibold text-primary mb-2 text-sm">Logo Requirements:</h5>
                  <ul className="space-y-1 text-gray-700 text-xs">
                    <li>• <strong>Format:</strong> PNG, JPG, or SVG</li>
                    <li>• <strong>Size:</strong> 400x160px (2.5:1 ratio)</li>
                    <li>• <strong>File size:</strong> Max 5MB</li>
                    <li>• <strong>Background:</strong> Transparent PNG best</li>
                  </ul>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-purple-200">
                  <h5 className="font-semibold text-green-800 mb-2 text-sm">Pro Tips:</h5>
                  <ul className="space-y-1 text-gray-700 text-xs">
                    <li>• Use high-resolution to avoid pixelation</li>
                    <li>• Ensure visibility on light & dark backgrounds</li>
                    <li>• Test on mobile devices first</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Brand Colors Section */}
            <div>
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Palette className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-2 text-lg">Set Brand Colors</h4>
                  <p className="text-gray-700 text-sm">
                    Customise the colour scheme to match your brand identity.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-purple-200">
                  <label className="block font-semibold text-primary mb-2 text-sm">Primary Color</label>
                  <p className="text-xs text-gray-600 mb-3">
                    Buttons, headers, and key interactive elements
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg border-2 border-gray-300 shadow-sm"></div>
                    <div>
                      <p className="text-xs text-gray-700 font-mono">#16A34A</p>
                      <p className="text-xs text-gray-500">Brand main color</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-purple-200">
                  <label className="block font-semibold text-primary mb-2 text-sm">Secondary Color</label>
                  <p className="text-xs text-gray-600 mb-3">
                    Backgrounds, borders, and subtle accents
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg border-2 border-gray-300 shadow-sm"></div>
                    <div>
                      <p className="text-xs text-gray-700 font-mono">#DBEAFE</p>
                      <p className="text-xs text-gray-500">Complementary</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50/80 backdrop-blur border border-yellow-300 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  <strong>Note:</strong> Changes update immediately on all feedback forms and customer-facing pages.
                </p>
              </div>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Step 4: Operating Hours</h2>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <h4 className="font-semibold text-primary mb-3 text-lg">Set Your Business Hours</h4>
            <p className="text-gray-700 mb-4">
              Define when your venue is open to help with feedback timing and analytics.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h5 className="font-semibold text-primary mb-4">Example Schedule:</h5>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between items-center bg-white rounded px-4 py-3">
                  <span className="font-semibold">Monday - Friday</span>
                  <span>11:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between items-center bg-white rounded px-4 py-3">
                  <span className="font-semibold">Saturday</span>
                  <span>10:00 AM - 11:00 PM</span>
                </div>
                <div className="flex justify-between items-center bg-white rounded px-4 py-3">
                  <span className="font-semibold">Sunday</span>
                  <span>10:00 AM - 9:00 PM</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Tip:</strong> You can also set feedback collection hours separately if you want to limit when customers can leave feedback.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">Step 5: Review & Save</h2>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border border-green-200">
            <h4 className="font-semibold text-primary mb-4 text-lg">Before You Save - Checklist:</h4>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                <span className="text-gray-700">Venue name is clear and professional</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                <span className="text-gray-700">Contact information is accurate and up-to-date</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                <span className="text-gray-700">Logo is uploaded and displays correctly</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                <span className="text-gray-700">Brand colors match your identity</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-5 h-5 text-brand rounded" />
                <span className="text-gray-700">Operating hours are set correctly</span>
              </label>
            </div>

            <div className="mt-6 pt-6 border-t border-green-200">
              <p className="text-gray-700 mb-4">
                Once you've verified everything, click the <strong className="text-brand">Save Changes</strong> button at the bottom of the page.
              </p>
              <p className="text-sm text-gray-600">
                Don't worry - you can always come back and update these settings later!
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary mb-4">Next Steps</h2>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <p className="text-gray-700 mb-4">
              Now that your venue is set up, you're ready to:
            </p>
            <div className="space-y-3">
              <a href="/help/creating-effective-questions" className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <span className="font-semibold text-primary">Create your feedback questions</span>
                </div>
                <span className="text-brand group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a href="/help/creating-qr-code" className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <span className="font-semibold text-primary">Generate your QR code</span>
                </div>
                <span className="text-brand group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a href="/help/understanding-kiosk-mode" className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <span className="font-semibold text-primary">Set up Kiosk Mode</span>
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

export default SettingUpFirstVenue;
