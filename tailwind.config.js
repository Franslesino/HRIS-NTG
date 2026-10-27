/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#EAF7FB',
          100: '#D5EFF7',
          500: '#29A9CC',
          600: '#1E93B3',
          700: '#177C98',
        },
        ink: { DEFAULT: '#1B1F27', soft: '#6B7280' },
        surface: '#F6F7F9',
        line: '#E3E6EB',
      },
    },
  },
  plugins: [],
}
