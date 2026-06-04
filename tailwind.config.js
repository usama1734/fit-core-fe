/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fitcore: {
          primary: '#0f766e',
          secondary: '#134e4a',
          accent: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
