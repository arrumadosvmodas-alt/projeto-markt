/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: 'var(--color-cream-50)',
          100: 'var(--color-cream-100)',
          200: 'var(--color-cream-200)',
        },
        forest: {
          50: 'var(--color-forest-50)',
          100: 'var(--color-forest-100)',
          300: 'var(--color-forest-300)',
          500: 'var(--color-forest-500)',
          600: 'var(--color-forest-600)',
          700: 'var(--color-forest-700)',
        },
        clay: {
          100: 'var(--color-clay-100)',
          400: 'var(--color-clay-400)',
          600: 'var(--color-clay-600)',
        },
        graphite: {
          50: 'var(--color-graphite-50)',
          400: 'var(--color-graphite-400)',
          500: 'var(--color-graphite-500)',
          700: 'var(--color-graphite-700)',
          900: 'var(--color-graphite-900)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
