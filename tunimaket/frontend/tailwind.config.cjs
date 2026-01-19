// Updated frontend/tailwind.config.cjs - Enable dark mode
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        'tm-orange': '#ff8a00',
        'tm-deep-orange': '#ff6a00',
        'tm-teal': '#00b3a6',
        'tm-yellow': '#ffd166',
        'tm-black': '#000000',
        'tm-white': '#ffffff',
        'tm-light-bg': '#f9fafb',
        'tm-dark-bg': '#111827',
        'tm-light-text': '#1f2937',
        'tm-dark-text': '#d1d5db',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};