/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        background: { DEFAULT: 'var(--background)' },
        foreground: { DEFAULT: 'var(--foreground)' },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: { DEFAULT: 'var(--border)' },
        input: { DEFAULT: 'var(--input)' },
        ring: { DEFAULT: 'var(--ring)' },
        flame: {
          500: '#FF5A1F',
          700: '#D43A0A',
          300: '#FF8A22',
        },
        amber: {
          500: '#B45309',
        },
        ink: {
          900: '#111827',
          500: '#6B7280',
          night: '#140E0A',
        },
        cream: {
          50: '#F5F6F8',
          100: '#F0F1F3',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 4px)',
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 4px)',
        xl: 'calc(var(--radius) + 8px)',
        '2xl': 'calc(var(--radius) + 16px)',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['Arial', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
      },
      boxShadow: {
        'flame-sm': '0 2px 8px rgba(255, 90, 31, 0.2)',
        'flame-md': '0 4px 16px rgba(255, 90, 31, 0.25)',
        'flame-lg': '0 8px 32px rgba(255, 90, 31, 0.3)',
        'card': '0 1px 4px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.1)',
      },
      keyframes: {
        livePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'live-pulse': 'livePulse 2s ease-in-out infinite',
        'fade-in': 'fadeIn 200ms ease forwards',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};