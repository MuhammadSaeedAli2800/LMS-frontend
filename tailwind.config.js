/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1d4ed8',
          dark: '#1e3a8a',
          soft: '#eff6ff',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#475569',
          faint: '#64748b',
        },
        surface: '#f4f6f8',
        line: '#e2e8f0',
        success: { DEFAULT: '#047857', soft: '#ecfdf5' },
        warning: { DEFAULT: '#b45309', soft: '#fffbeb' },
        danger: { DEFAULT: '#b91c1c', soft: '#fef2f2' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
