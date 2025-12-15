/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  safelist: [
    // Leitner box classes that are constructed dynamically
    'leitner-box-bg-1',
    'leitner-box-bg-2',
    'leitner-box-bg-3',
    'leitner-box-bg-4',
    'leitner-box-bg-5',
    'leitner-box-text-1',
    'leitner-box-text-2',
    'leitner-box-text-3',
    'leitner-box-text-4',
    'leitner-box-text-5',
    'leitner-box-surface-1',
    'leitner-box-surface-2',
    'leitner-box-surface-3',
    'leitner-box-surface-4',
    'leitner-box-surface-5',
    // Transparent variants for softer feel
    'leitner-box-bg-transparent-1',
    'leitner-box-bg-transparent-2',
    'leitner-box-bg-transparent-3',
    'leitner-box-bg-transparent-4',
    'leitner-box-bg-transparent-5',
    'leitner-box-surface-transparent-1',
    'leitner-box-surface-transparent-2',
    'leitner-box-surface-transparent-3',
    'leitner-box-surface-transparent-4',
    'leitner-box-surface-transparent-5',
    'leitner-box-dot-1',
    'leitner-box-dot-2',
    'leitner-box-dot-3',
    'leitner-box-dot-4',
    'leitner-box-dot-5',
    // CSS variable classes
    'bg-[hsl(var(--metric-due-bg))]',
    'text-[hsl(var(--metric-due-fg))]',
    'bg-[hsl(var(--metric-streak-bg))]',
    'text-[hsl(var(--metric-streak-fg))]',
    'bg-[hsl(var(--metric-best-bg))]',
    'text-[hsl(var(--metric-best-fg))]',
    'bg-[hsl(var(--metric-started-bg))]',
    'text-[hsl(var(--metric-started-fg))]',
    'bg-[hsl(var(--metric-accuracy-bg))]',
    'text-[hsl(var(--metric-accuracy-fg))]',
    // Transparent Leitner box variable classes
    'bg-[hsl(var(--box1-bg-transparent))]',
    'bg-[hsl(var(--box2-bg-transparent))]',
    'bg-[hsl(var(--box3-bg-transparent))]',
    'bg-[hsl(var(--box4-bg-transparent))]',
    'bg-[hsl(var(--box5-bg-transparent))]',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          light: 'hsl(var(--destructive-light))',
          'light-foreground': 'hsl(var(--destructive-light-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          light: 'hsl(var(--success-light))',
          'light-foreground': 'hsl(var(--success-light-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-success': 'pulseSuccess 0.6s ease-in-out',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSuccess: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')], // eslint-disable-line @typescript-eslint/no-require-imports
};
