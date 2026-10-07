/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#1d4ed8',
          700: '#1e3a8a',
          900: '#0f172a'
        }
      }
    }
  },
  plugins: []
};
