/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        mint: '#10b981',
        sand: '#f8fafc'
      }
    }
  },
  plugins: []
};
