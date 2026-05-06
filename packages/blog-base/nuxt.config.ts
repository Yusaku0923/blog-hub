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
  typescript: { strict: true },
  nitro: {
    preset: 'cloudflare-pages-static',
  },
})
