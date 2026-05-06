import type { SiteConfig } from '../types/app-config'

export const useSiteConfig = (): SiteConfig => {
  const appConfig = useAppConfig()
  return (appConfig.site ?? {}) as SiteConfig
}
