/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")], 
  theme: {
    extend: {
      colors: {
        primary: '#1a56db',
        secondary: '#9333ea',
        background: '#0f172a',
        card: '#1e293b',
        common: '#9ca3af',
        rare: '#3b82f6',
        epic: '#a855f7',
        legendary: '#f59e0b',
        mythic: '#ef4444',
      },
    },
  },
  plugins: [],
}