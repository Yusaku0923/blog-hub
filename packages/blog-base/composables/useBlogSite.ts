import type { SiteConfig } from '../types/app-config'

// Named useBlogSite (not useSiteConfig) because @nuxtjs/sitemap pulls in
// nuxt-site-config, which auto-exports a global useSiteConfig() that
// returns deployment-URL info — same name, different shape. Picking
// our own distinct name avoids the auto-import clash.
export const useBlogSite = (): SiteConfig => {
  const appConfig = useAppConfig()
  return (appConfig.site ?? {}) as SiteConfig
}
