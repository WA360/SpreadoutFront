import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'custom-gradient':
          'linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 19%, rgba(255,255,255,0) 100%);',
      },
      animation: {
        bounce: 'bounce 1s infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      spacing: {
        '2.5': '0.625rem',
      },
    },
  },
  variants: {
    extend: {
      animation: ['group-hover'],
    },
  },
  plugins: [require('tailwind-scrollbar-hide')],
  darkMode: 'class',
};
export default config;
