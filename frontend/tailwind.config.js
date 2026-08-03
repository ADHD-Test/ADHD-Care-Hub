/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12202B',      // primary text and headers
        slate: '#4A5D6B',    // secondary text
        paper: '#F5F7F8',    // page background
        surface: '#FFFFFF',
        edge: '#DDE4E8',     // hairlines and borders
        sage: '#3F7F73',     // primary action
        'sage-soft': '#E4F0ED',
        amber: '#C2762B',    // today / attention, used sparingly
        'amber-soft': '#F8EDDF',
      },
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      borderRadius: { card: '14px' },
      boxShadow: { card: '0 1px 2px rgba(18,32,43,0.04), 0 8px 24px rgba(18,32,43,0.05)' },
    },
  },
  plugins: [],
};
