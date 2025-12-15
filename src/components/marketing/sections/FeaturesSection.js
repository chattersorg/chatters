import React from 'react';
import { QrCode, BarChart, Gauge, Paintbrush, ClipboardList, LayoutDashboard } from 'lucide-react';

const FeaturesSection = () => {
  return (
    <section>
      {/* Container */}
      <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-20">
        {/* Full-width grid */}
        <div className="grid items-center gap-8">
          {/* List */}
          <ul className="grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-6 mx-auto">
            <li className="flex flex-col p-5">
              <QrCode className="mb-4 h-10 w-10 text-black" />
              <p className="mb-2 font-semibold">Smart QR Codes</p>
              <p className="text-sm text-gray-500">
                Place at every table so guests can share feedback instantly, no app required.
              </p>
            </li>
            <li className="flex flex-col p-5">
              <BarChart className="mb-4 h-10 w-10 text-black" />
              <p className="mb-2 font-semibold">Real-Time Alerts</p>
              <p className="text-sm text-gray-500">
                Be notified the moment a guest is unhappy, and resolve it before they leave angry.
              </p>
            </li>
            <li className="flex flex-col p-5">
              <ClipboardList className="mb-4 h-10 w-10 text-black" />
              <p className="mb-2 font-semibold">Custom Feedback Prompts</p>
              <p className="text-sm text-gray-500">
                Ask the right questions for your venue: food, service, cleanliness, and more.
              </p>
            </li>
            <li className="flex flex-col p-5">
              <Gauge className="mb-4 h-10 w-10 text-black" />
              <p className="mb-2 font-semibold">Review Boosting</p>
              <p className="text-sm text-gray-500">
                Automatically route happy guests to Google/TripAdvisor to leave glowing reviews.
              </p>
            </li>
            <li className="flex flex-col p-5">
              <Paintbrush className="mb-4 h-10 w-10 text-black" />
              <p className="mb-2 font-semibold">Your Branding</p>
              <p className="text-sm text-gray-500">
                Fully customisable to match your brand: logo, tone, and customer voice.
              </p>
            </li>
            <li className="flex flex-col p-5">
              <LayoutDashboard className="mb-4 h-10 w-10 text-black" />
              <p className="mb-2 font-semibold">Manager Dashboard</p>
              <p className="text-sm text-gray-500">
                See what guests are saying, what’s getting fixed, and what needs improving.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;