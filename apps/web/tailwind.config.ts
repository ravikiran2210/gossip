import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff4ee',
          100: '#ffe3cc',
          200: '#ffc49a',
          300: '#ffa06b',
          400: '#f87c40',
          500: '#e8622a',
          600: '#d04f1e',
          700: '#ac3d17',
          800: '#8a2f13',
          900: '#6b230f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
