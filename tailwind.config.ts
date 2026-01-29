import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,vue,ts}',
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  // Safelist classes that are dynamically generated
  safelist: [
    'bg-warning',
    'bg-success',
    'bg-slate-400',
    'text-primary',
    'text-warning',
    'text-success',
    'text-danger',
    'bg-warning/10',
    'bg-success/10',
    'text-warning',
    'text-success',
    'ring-warning/20',
    'ring-success/20',
    'animate-ping',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1d4ed8',
        },
        background: {
          light: '#F3F4F6',
          dark: '#0F172A',
        },
        card: {
          light: '#FFFFFF',
          dark: '#1E293B',
        },
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
      },
    },
  },
  plugins: [],
} satisfies Config
