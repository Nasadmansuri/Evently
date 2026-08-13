/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary: Teal — the ONLY color that means "primary action" or "active state"
        primary: {
          50: '#E6EFEF',
          100: '#CCDFDE',
          500: '#046C6A',
          600: '#035352',
          700: '#024342',
        },
        // Accent: Sidecar Yellow — used sparingly for highlight badges/recommended sections only
        accent: {
          DEFAULT: '#F3E8BC',
          text: '#8A6D1D',
        },
        // Category tag colors — deliberately distinct from primary/accent, never reused as UI chrome
        category: {
          technical: '#2563EB',
          cultural: '#6B7280',
          workshop: '#F97316',
          competition: '#9333EA',
          seminar: '#B45309',
          sports: '#EC4899',
          conference: '#475569',
        },
      },
    },
  },
  plugins: [],
};