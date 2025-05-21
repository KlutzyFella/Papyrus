/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        // custom colors
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}
