import React from 'react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "We stopped over 50 potential one-star reviews in the first six weeks.",
    name: "Emma Walsh",
    role: "Owner, The Dockside",
  },
  {
    quote: "Instant alerts mean my staff fix issues before I even reach the floor.",
    name: "Daniel Price",
    role: "GM, Riverside Bar & Kitchen",
  },
  {
    quote: "Our TripAdvisor page is now full of five-star reviews instead of mixed ratings.",
    name: "Sophie Martin",
    role: "Owner, The Old Wharf",
  },
];

const Testimonials = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Don't Take Our Word For It
          </h2>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6">
                <Quote className="w-8 h-8 text-[#4E74FF]/30" />
              </div>

              {/* Quote Text */}
              <blockquote className="text-lg text-gray-700 italic mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                {/* Avatar Placeholder */}
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
