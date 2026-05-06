export const useCategoryLabel = (key: string): string => {
  const site = useBlogSite()
  return site.categoryLabels?.[key] ?? key
}
