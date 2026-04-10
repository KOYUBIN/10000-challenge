/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0e1a',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
        },
        brand: {
          500: '#f59e0b',
          400: '#fbbf24',
        },
        success: '#10b981',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
};
