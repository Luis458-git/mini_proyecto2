/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d8eeff',
          500: '#0070f3',
          600: '#0058c4',
          700: '#004396',
          900: '#002557',
        },
      },
    },
  },
  plugins: [],
};
