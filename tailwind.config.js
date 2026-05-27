/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        chat: {
          bg: '#111214',
          sidebar: '#07080a',
          surface: '#292b2e',
          elevated: '#232529',
          hover: '#202226',
          border: '#34373c',
          text: '#f1f1f2',
          muted: '#b8babf',
          tertiary: '#8f939b',
          accent: '#78d6b5',
          warning: '#ffd166',
          danger: '#ff6b6b'
        }
      },
      boxShadow: {
        composer: '0 18px 60px rgb(0 0 0 / 0.42)'
      }
    }
  },
  plugins: []
};
