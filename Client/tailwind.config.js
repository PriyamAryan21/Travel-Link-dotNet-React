/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We will define a premium color palette for TravelLink here
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0070f3', // TravelLink primary blue
          600: '#005ed3',
          700: '#004cb3',
        }
      }
    },
  },
  plugins: [],
}
