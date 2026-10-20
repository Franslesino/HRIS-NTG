/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bmis-bg': '#f3f6f9',
        'bmis-card': '#ffffff',
        'bmis-green': '#3abf94',
        'bmis-green-hover': '#2ea881',
        'bmis-green-light': '#e8f8f3',
        'bmis-teal': '#00a389',
        'bmis-teal-hover': '#008a74',
        'bmis-teal-light': '#e6f6f3',
        'bmis-teal-border': '#bce6dc',
        'bmis-blue': '#547fff',
        'bmis-blue-hover': '#436fe6',
        'bmis-blue-light': '#ebf2fc',
        'bmis-yellow': '#ffc247',
        'bmis-yellow-light': '#fef7e6',
        'bmis-purple': '#9964e3',
        'bmis-purple-light': '#f3edfc',
        'bmis-red': '#f55d5d',
        'bmis-red-light': '#fdeeee',
        'bmis-border': '#d6dee5',
        'bmis-text': '#29323a',
        'bmis-label': '#495057',
        'bmis-muted': '#798892',
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
