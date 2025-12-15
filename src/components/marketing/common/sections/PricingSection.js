// components/marketing/pricing/PricingSection.jsx
import React from "react";
import PrimaryButton from "../buttons/PrimaryButton";
import { Check } from "lucide-react";

const PricingSection = ({
  // Headline + CTA
  eyebrow = "Pricing",
  title = "Tailored for your business",
  subtitle = "Every venue is different - our pricing is customised to fit your needs. From single sites to groups, we’ll build a plan that scales with you.",
  buttonText = "Speak to Sales",
  buttonLink = "/demo",

  // Features checklist
  features = [
    "Unlimited guest feedback",
    "Instant staff alerts",
    "Works across all locations",
    "Custom branding & logos",
    "Analytics & reporting",
    "Google & TripAdvisor routing",
    "Role-based access",
    "Dedicated support",
  ],

  // Styling controls
  gradientDirection = "bg-gradient-to-b",
  backgroundGradient = "from-white via-white to-purple-50",
  dottedBackground = true,
  orbGlow = false,          // off by defaufffflt to keep it clean; set true if you want the glow
  wavyTop = false,          // optional: add a top wave if this follows a white section
  wavyBottom = false,       // optional: add a bottom wave fade to white
}) => {
  return (
    <section className={`relative w-full overflow-hidden ${gradientDirection} ${backgroundGradient}`}>
      {/* Optional wavy top */}
      {wavyTop && (
        <div className="absolute inset-x-0 top-0 h-16">
          <svg className="w-full h-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,60 C240,0 480,120 720,60 C960,0 1200,120 1440,60 L1440,0 L0,0 Z" fill="url(#fade-top)" />
            <defs>
              <linearGradient id="fade-top" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,1)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* Dots */}
      {dottedBackground && (
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "28px 28px",
          }}
        />
      )}

      {/* Orbs (optional, subtle) */}
      {orbGlow && (
        <>
          <div
            aria-hidden="true"
            className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.16), transparent)" }}
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 -right-24 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(59,130,246,0.12), transparent)" }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative max-w-[1100px] mx-auto px-6 py-20 lg:py-24 text-center">
        {eyebrow && (
          <p className="text-xs tracking-widest uppercase font-semibold text-green-600/80 mb-3">
            {eyebrow}
          </p>
        )}

        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-satoshi mb-4">
          {title}
        </h2>

        {subtitle && (
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}

        <PrimaryButton text={buttonText} to={buttonLink} size="lg" />

        {/* Checklist */}
        {features?.length > 0 && (
          <div className="mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-left max-w-3xl mx-auto">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex p-1 rounded-full bg-green-100 text-green-700">
                    <Check className="w-4 h-4" />
                  </span>
                  <span className="text-gray-700 text-base leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Optional wavy bottom (fade to white like your Hero) */}
      {wavyBottom && (
        <div className="absolute inset-x-0 bottom-0 h-10">
          <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="url(#fade-pricing-bottom)" />
            <defs>
              <linearGradient id="fade-pricing-bottom" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                <stop offset="100%" stopColor="rgba(255,255,255,1)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </section>
  );
};

export default PricingSection;
