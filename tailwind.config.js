/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dashboard)', 'ui-sans-serif', 'system-ui'],
        'marketing': ['var(--font-marketing)', 'ui-sans-serif', 'system-ui'],
        'jakarta': ['Plus Jakarta Sans', 'var(--font-dashboard)', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        'custom': {
          'black': '#000000',
          'blue': '#2563EB',
          'green': '#22C55D',
          'red': '#EB3232',
          'yellow': '#FBBF24',
          'black-hover': '#000000',
          'blue-hover': '#124BC7',
          'green-hover': '#1B9E4A',
          'red-hover': '#d01414',
          'yellow-hover': '#e1a404'
        }
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};
