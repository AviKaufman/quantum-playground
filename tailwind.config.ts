import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // “Display” for headings without introducing external font fetches.
        display: ['ui-serif', 'Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
