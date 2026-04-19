/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#05080f',
        charcoal: '#111520',
        'neon-green': '#00ff88',
        'neon-red': '#ff003c',
        'neon-blue': '#00f2fe',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-gradient': 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
      },
    },
  },
  plugins: [],
};
