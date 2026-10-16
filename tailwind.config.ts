import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          spicy: {
            DEFAULT: '#ef4444',
            hover: '#dc2626',
            light: '#fef2f2',
            dark: '#991b1b',
          },
          constructive: {
            DEFAULT: '#3b82f6',
            hover: '#2563eb',
            light: '#eff6ff',
            dark: '#1e40af',
          },
          privacy: {
            DEFAULT: '#10b981',
            hover: '#059669',
            light: '#ecfdf5',
            dark: '#065f46',
          },
          amber: {
            DEFAULT: '#f59e0b',
            hover: '#d97706',
            light: '#fffbeb',
            dark: '#92400e',
          },
          surface: {
            DEFAULT: '#0a0f1d',
            card: '#111827',
            border: '#1f2937',
            muted: '#374151',
            input: '#1a2234',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
