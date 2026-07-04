/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        surface: '#1A1A1A',
        panel: '#1E1E1E',
        border: '#333333',
        accent: {
          DEFAULT: '#2563EB',
          light: '#29A7F2',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#9A9A9A',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
