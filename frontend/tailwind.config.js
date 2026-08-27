/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#E6EFEF',
          100: '#CCDFDE',
          200: '#99C0BE',
          300: '#66A09D',
          400: '#33817D',
          500: '#046C6A',
          600: '#035352',
          700: '#024342',
          800: '#023433',
          900: '#012424',
          950: '#011515',
        },
        // Academic Prestige Warm Gold Accent
        gold: {
          50: '#FFFDF5',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
        },
        // Accent: Warm Gold / Amber highlight
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
          text: '#92400E',
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