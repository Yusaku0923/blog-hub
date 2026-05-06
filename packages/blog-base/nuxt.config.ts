import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Layer paths must resolve relative to THIS file, not the consuming
// project. `~/` in a layer's nuxt.config gets re-rooted at the
// consumer's CWD, so layer-owned assets get lost. Force absolute paths
// via import.meta.url.
const layerDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    '@nuxt/content',
    '@nuxtjs/mdc',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxt/image',
  ],
  image: {
    format: ['webp'],
    provider: 'ipxStatic',
  },
  components: [
    { path: resolve(layerDir, 'components'), pathPrefix: false },
  ],
  css: [resolve(layerDir, 'assets/css/base.css')],
  // Ship the Tailwind preset and content paths via the module config
  // so the consumer's tailwind.config.ts doesn't need to import them
  // directly. Cross-layer JS imports from tailwind.config.ts fail at
  // Tailwind module init (loaded before Vite/Nuxt aliases are active),
  // exactly like content.config.ts. This route survives both file-path
  // and giget-cache layer distribution.
  tailwindcss: {
    config: {
      content: [
        resolve(layerDir, 'components/**/*.{vue,ts}'),
        resolve(layerDir, 'layouts/**/*.vue'),
        resolve(layerDir, 'pages/**/*.vue'),
      ],
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
    },
  },
  typescript: { strict: true },
  nitro: {
    preset: 'cloudflare-pages-static',
  },
})
