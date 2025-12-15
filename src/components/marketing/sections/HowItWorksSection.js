import React from 'react';

const HowItWorksSection = () => {
  return (
    <section className="py-12">
      {/* Container */}
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-5 py-16 md:px-10 md:py-20">
        {/* Heading */}
        <p className="font-inter mb-2 text-center text-sm font-medium">
          3 EASY STEPS
        </p>
        <h1 className="text-center text-3xl font-bold lg:text-4xl">
          How It Works
        </h1>
        <p className="font-inter mx-auto mb-12 mt-4 max-w-lg px-5 text-center text-base font-light text-gray-500">
          Stop negative reviews in 3 steps - catch unhappy guests before they leave and fix the problem on the spot.
        </p>

        {/* Steps */}
        <div className="flex flex-col items-start justify-center lg:flex-row">
          {/* Step 1 */}
          <div className="relative my-8 flex w-full rounded-md lg:mx-8 lg:flex-col">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-200">
              <h2 className="text-3xl font-medium">1</h2>
            </div>
            <div className="ml-6 lg:ml-0">
              <h2 className="mb-5 text-xl font-medium lg:mt-8">Guests Scan QR Code</h2>
              <p className="font-inter max-w-md pr-5 text-base text-gray-500">
                Guests scan a QR code at their table to leave quick, honest feedback in seconds - no app needed.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative my-8 flex w-full rounded-md lg:mx-8 lg:flex-col">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-200">
              <h2 className="text-3xl font-medium">2</h2>
            </div>
            <div className="ml-6 lg:ml-0">
              <h2 className="mb-5 text-xl font-medium lg:mt-8">Real-Time Alert</h2>
              <p className="font-inter max-w-md pr-5 text-base text-gray-500">
                If a guest is unhappy, your team gets notified instantly - giving you a chance to fix it before they walk out.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative my-8 flex w-full rounded-md lg:mx-8 lg:flex-col">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-200">
              <h2 className="text-3xl font-medium">3</h2>
            </div>
            <div className="ml-6 lg:ml-0">
              <h2 className="mb-5 text-xl font-medium lg:mt-8">Take Action - Instantly</h2>
              <p className="font-inter max-w-md pr-5 text-base text-gray-500">
                Speak to the guest, solve the issue, and turn a 1-star experience into a 5-star review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
