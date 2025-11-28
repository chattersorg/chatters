import React from 'react';

const Problem = () => {
  return (
    <section className="bg-slate-900 pt-40 lg:pt-48 pb-20 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Section Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            The Silent Customer Problem in Hospitality
          </h2>

          {/* Body Text */}
          <div className="text-xl text-slate-300 space-y-6 mb-12">
            <p>
              <span className="text-white font-semibold">68% of unhappy customers won't complain to your staff.</span>
              <br />
              They'll just leave — and tell everyone else online.
            </p>

            <p>
              A single 1-star review can take dozens of positive reviews to balance out.
            </p>

            <p>
              Chatters gives you real-time visibility so you can fix issues before the customer walks out — and before the review goes public.
            </p>
          </div>

          {/* Visual */}
          <div className="mt-12">
            <img
              src="https://placehold.co/800x300/1e293b/94a3b8?text=Guest+Journey+Graphic"
              alt="Guest journey: frustrated guest leaves and posts negative review before manager sees"
              className="w-full max-w-3xl mx-auto rounded-xl"
            />

            {/* Journey steps below image */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">😤</span>
                </div>
                <p className="text-sm text-slate-400">Guest frustrated</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🚶</span>
                </div>
                <p className="text-sm text-slate-400">Leaves quietly</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">⭐</span>
                </div>
                <p className="text-sm text-slate-400">Posts 1-star review</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">😱</span>
                </div>
                <p className="text-sm text-slate-400">Manager sees too late</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
