/** @type {import('tailwindcss').Config} */
// Terminal theme: phosphor-green on near-black, monospace everywhere, sharp corners.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#010302',
          900: '#030705',
          850: '#060c08',
          800: '#09110c',
          750: '#0d1710',
          700: '#122016',
          600: '#1a2e20',
          500: '#284432',
          400: '#4a6b55',
          300: '#7a9c84',
          200: '#a8c6b0',
          100: '#d2ead8',
          50: '#ecfdf0',
        },
        neon: { 50: '#e9fff3', 100: '#bbffd9', 200: '#7dffb6', 300: '#39ff95', 400: '#14d473', 500: '#0a9e55' },
        gain: { DEFAULT: '#2bf08a', soft: 'rgba(43,240,138,0.12)' },
        loss: { DEFAULT: '#ff4d6a', soft: 'rgba(255,77,106,0.12)' },
        amber: { DEFAULT: '#ffb547' },
        violet: { DEFAULT: '#4dd8ff' },
      },
      fontFamily: {
        sans: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"VT323"', '"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '1px',
        DEFAULT: '2px',
        md: '2px',
        lg: '3px',
        xl: '3px',
        '2xl': '4px',
        '3xl': '4px',
        '4xl': '6px',
      },
      boxShadow: {
        neu: '0 0 0 1px rgba(57,255,149,0.05), 0 18px 40px -20px rgba(0,0,0,0.9)',
        'neu-sm': '0 0 0 1px rgba(57,255,149,0.04)',
        'neu-in': 'inset 0 0 0 1px rgba(57,255,149,0.04)',
        glow: '0 0 0 1px rgba(57,255,149,0.45), 0 0 24px -4px rgba(57,255,149,0.45)',
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        blink: { '0%,49%': { opacity: 1 }, '50%,100%': { opacity: 0 } },
        flicker: { '0%,100%': { opacity: 1 }, '92%': { opacity: 1 }, '93%': { opacity: 0.85 }, '94%': { opacity: 1 } },
      },
      animation: {
        marquee: 'marquee 90s linear infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        blink: 'blink 1.05s step-end infinite',
        flicker: 'flicker 6s linear infinite',
      },
    },
  },
  plugins: [],
};
