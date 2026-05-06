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
    { path: '~/components', pathPrefix: false },
  ],
  typescript: { strict: true },
  nitro: {
    preset: 'cloudflare-pages-static',
  },
})
