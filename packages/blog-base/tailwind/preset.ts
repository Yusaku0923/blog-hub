import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        bg:      'var(--color-bg)',
        paper:   'var(--color-paper)',
        ink:     'var(--color-ink)',
        muted:   'var(--color-muted)',
        line:    'var(--color-line)',
        tag:     'var(--color-tag)',
        accent:  'var(--color-accent)',
        accent2: 'var(--color-accent2)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },
    },
  },
}
