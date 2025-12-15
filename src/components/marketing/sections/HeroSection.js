import React from 'react';

const HeroSection = () => {
  return (
    <header>
      {/* Hero Container */}
      <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-20">
        {/* Component */}
        <div className="grid items-center justify-items-start gap-8 sm:gap-20 lg:grid-cols-2">
          {/* Hero Content */}
          <div className="flex flex-col">
            {/* Hero Title */}
            <h1 className="mb-4 text-4xl font-bold md:text-6xl">
              Stop Bad Reviews Before They Happen
            </h1>
            <p className="mb-6 max-w-lg text-sm text-gray-500 sm:text-xl md:mb-10 lg:mb-12">
              Guests scan a QR code at their table. If they’re unhappy, your team gets an instant alert - so you can fix the issue before they blast you online.
            </p>
            {/* Hero Button */}
            <div className="flex items-center">
              <a
                href="/demo"
                className="mr-5 items-center rounded-md bg-black px-6 py-3 font-semibold text-white md:mr-6 lg:mr-8"
              >
                See how it works
              </a>
              <a href="/pricing" className="flex max-w-full items-center font-bold">
                <img
                  src="https://assets.website-files.com/6458c625291a94a195e6cf3a/6458c625291a94bd85e6cf98_ArrowUpRight%20(4).svg"
                  alt=""
                  className="mr-2 inline-block max-h-4 w-5"
                />
                <p>Pricing</p>
              </a>
            </div>
          </div>
          {/* Hero Image */}
          <img
            src="/img/homepage/homepage-hero.png"
            alt=""
            className="inline-block h-full w-full max-w-2xl"
          />
        </div>
      </div>
    </header>
  );
};

export default HeroSection;
