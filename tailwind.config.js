/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        surface: '#121214',
        elevated: '#1C1C20',
        line: 'rgba(255, 255, 255, 0.08)',
        primary: {
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          900: '#064E3B',
        },
        secondary: {
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          900: '#0C4A6E',
        },
        accent: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
        },
        success: {
          400: '#4ADE80',
          500: '#22C55E',
        },
        warning: {
          400: '#FB923C',
          500: '#F97316',
        },
        error: {
          400: '#F87171',
          500: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scaleY(0.6)', opacity: '0.55' },
          '50%': { transform: 'scaleY(1)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        breathe: 'breathe 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
