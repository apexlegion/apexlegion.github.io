/**
 * AI Atlas — Tailwind theme extension.
 *
 * Tailwind v4 reads its theme from CSS via `@theme` in `src/styles/global.css`.
 * This file remains so that editors and tooling that scan for a JS config still
 * see the canonical token names, and so that we have a single JS reference for
 * tokens that need to be consumed outside CSS (e.g. metadata, tests).
 *
 * Source of truth: `src/styles/tokens.css` and `src/styles/global.css`.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Brand — Affiliate Forge orange signature
        primary: {
          DEFAULT: 'var(--color-primary-orange)',
          hover: 'var(--color-secondary-orange)',
          accent: 'var(--color-accent-orange)',
        },
        // Surfaces — premium black palette
        surface: {
          DEFAULT: 'var(--color-primary-black)',
          raised: 'var(--color-secondary-black)',
          elevated: 'var(--color-surface)',
          card: 'var(--color-card)',
        },
        // Borders and dividers
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        // Text
        text: {
          DEFAULT: 'var(--color-white)',
          muted: 'var(--color-muted)',
          subtle: 'var(--color-subtle)',
          inverse: 'var(--color-primary-black)',
        },
        // Semantic
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['4rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h1: ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h2: ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        h3: ['1.5rem', { lineHeight: '1.3' }],
        body: ['1rem', { lineHeight: '1.6' }],
        small: ['0.875rem', { lineHeight: '1.5' }],
        tiny: ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: '9999px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
        focus: 'var(--shadow-focus)',
      },
      maxWidth: {
        container: '1280px',
        dashboard: '1440px',
        prose: '720px',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
      },
    },
  },
  plugins: [],
};
