import React from 'react';

const features = [
  {
    image: 'https://placehold.co/400x250/e2e8f0/475569?text=Live+Dashboard',
    title: 'Live Feedback Dashboard',
    description: 'See every rating as it happens. Colour-coded alerts highlight urgent issues. Spot patterns by table, time, or staff member.',
  },
  {
    image: 'https://placehold.co/400x250/e2e8f0/475569?text=Kiosk+Mode',
    title: 'Staff Kiosk Mode',
    description: "A real-time priority queue your team can't miss. Urgent feedback first. Interactive floor plan. One-tap acknowledgement & resolution logging.",
  },
  {
    image: 'https://placehold.co/400x250/e2e8f0/475569?text=Review+Prompt',
    title: 'Turn Happy Guests Into Reviews',
    description: 'Guests who rate highly are prompted to leave Google or TripAdvisor reviews automatically.',
  },
];

const Features = () => {
  return (
    <section className="bg-gray-50 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Powerful Tools Designed for Hospitality
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* Image */}
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
