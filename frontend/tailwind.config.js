/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f0f12',
        panel: '#1a1a22',
        border: '#2a2a38',
        muted: '#6b7280',
      }
    }
  },
  plugins: []
}