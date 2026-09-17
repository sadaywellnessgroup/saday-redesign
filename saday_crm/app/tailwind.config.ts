import type { Config } from 'tailwindcss';

/* Saday Wellness CRM — extends the main-site "waves & light" tokens
   (see docs: DECISION_LOG D-002, D-028). Do not invent new colours here;
   this file is a superset of _refs/main-site/tailwind.config.ts plus the
   shadcn/ui CSS-variable mapping so every shadcn component inherits the
   brand automatically. No hard borders — shadow-feather + soft radius
   carry structure instead. */
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- main-site brand tokens (verbatim) ---
        indigo: '#3E2A78',
        'indigo-deep': '#2B1D57',
        terracotta: '#B0522E',
        'terracotta-deep': '#8E4225',
        cream: '#FAF5EC',
        card: '#FFFDF6',
        turmeric: '#D69A3C',
        'lilac-tint': '#F1ECF9',
        ink: '#2A2320',
        'ink-soft': '#5C544E',

        // --- shadcn/ui CSS-variable mapping onto the brand tokens ---
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        // shadcn expects a "card" colour pair too; card/card-foreground.
        // "card" itself stays the brand hex above for direct utility use
        // (bg-card); shadcn's Card component uses these CSS vars.
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        hindi: ['var(--font-hindi)', 'serif'],
      },
      borderRadius: {
        soft: '18px',
        softer: '28px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      boxShadow: {
        feather: '0 2px 24px rgba(62, 42, 120, 0.08)',
        'feather-lg': '0 8px 44px rgba(62, 42, 120, 0.12)',
      },
      maxWidth: {
        wrap: '1240px',
      },
      spacing: {
        s1: '8px',
        s2: '16px',
        s3: '24px',
        s4: '32px',
        s5: '48px',
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(.22,.8,.3,1)',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
