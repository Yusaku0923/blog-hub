export interface NavItem {
  label: string
  to: string
}

export interface Masthead {
  tagline?: string
  subtitle?: string
  volumeBanner?: string
  volumeStartYear?: number
}

export interface SiteConfig {
  categoryLabels?: Record<string, string>
  navItems?: NavItem[]
  masthead?: Masthead
}

declare module '@nuxt/schema' {
  interface AppConfigInput {
    site?: SiteConfig
  }
  interface AppConfig {
    site?: SiteConfig
  }
}

export {}
