import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Colors from the image
        'brand-orange': '#FF6B35', // Orange used for "مركز" text
        'brand-green': '#22C55E', // Green used for "تميز" text
        'brand-blue': '#1E3A8A', // Dark blue used for tree trunk
      },
    },
  },
  plugins: [],
}
export default config

