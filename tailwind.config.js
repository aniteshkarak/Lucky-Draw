/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffdf5',
          100: '#fff9e6',
          200: '#fff0c2',
          300: '#ffe294',
          400: '#ffd054',
          500: '#f5b516',
          600: '#d9940b',
          700: '#b46e09',
          800: '#92530e',
          900: '#78430f',
          950: '#452204',
        },
        festive: {
          dark: '#0B0A10',
          card: '#161424',
          cardHover: '#1E1B33',
          border: 'rgba(245, 181, 22, 0.18)',
          glow: 'rgba(245, 181, 22, 0.35)',
          purple: '#2A1B4E',
          crimson: '#6B1130'
        }
      },
      fontFamily: {
        serif: ['Cormorant', 'Georgia', 'serif'],
        sans: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-spin': 'glowSpin 12s linear infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glowSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(245, 181, 22, 0.25)',
        'gold-intense': '0 0 45px rgba(245, 181, 22, 0.45)',
        'card-elevated': '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
      }
    },
  },
  plugins: [],
}
