export const useCategoryLabel = (key: string): string => {
  const site = useSiteConfig()
  return site.categoryLabels?.[key] ?? key
}
