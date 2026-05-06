export interface ArticleStructuredData {
  title: string
  description: string
  datePublished: Date | string
  dateModified: Date | string
  author: string
  url: string
  image?: string
  imageWidth?: number
  imageHeight?: number
}

export interface BreadcrumbItem {
  name: string
  url: string
}

const SITE_URL = 'https://pet-gurashi.com'
const SITE_NAME = 'ペットぐらし'

const AUTHOR_SCHEMA = {
  '@type': 'Person',
  name: 'ペットぐらし編集部',
  description: 'ペット飼育歴10年以上。犬・猫と暮らしながら、実際に購入・使用した製品を徹底検証して発信しています。',
}

const PUBLISHER_SCHEMA = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/og-default.png`,
    width: 1200,
    height: 630,
  },
}

function toIso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d
}

export function useArticleStructuredData(article: ArticleStructuredData) {
  useHead({
    script: [
      {
        key: 'structured-data-article',
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title,
          description: article.description,
          datePublished: toIso(article.datePublished),
          dateModified: toIso(article.dateModified),
          author: AUTHOR_SCHEMA,
          publisher: PUBLISHER_SCHEMA,
          mainEntityOfPage: { '@type': 'WebPage', '@id': article.url },
          inLanguage: 'ja',
          ...(article.image && {
            image: {
              '@type': 'ImageObject',
              url: article.image,
              ...(article.imageWidth && { width: article.imageWidth }),
              ...(article.imageHeight && { height: article.imageHeight }),
            },
          }),
        }),
      },
    ],
  })
}

export function useBreadcrumbStructuredData(items: BreadcrumbItem[]) {
  useHead({
    script: [
      {
        key: 'structured-data-breadcrumb',
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url,
          })),
        }),
      },
    ],
  })
}

export interface CollectionPageItem {
  title: string
  url: string
  description: string
}

export function useCollectionPageStructuredData(opts: {
  title: string
  description: string
  url: string
  items: CollectionPageItem[]
}) {
  useHead({
    script: [
      {
        key: 'structured-data-collection',
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: opts.title,
          description: opts.description,
          url: opts.url,
          inLanguage: 'ja',
          publisher: PUBLISHER_SCHEMA,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: opts.items.map((item, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: item.title,
              url: item.url,
              description: item.description,
            })),
          },
        }),
      },
    ],
  })
}

export function useOrganizationStructuredData() {
  useHead({
    script: [
      {
        key: 'structured-data-website',
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          description: '飼い主が「これ買ってよかった」と思える選択を、リアルな使用体験とデータで支援するペット用品レビューブログ。',
          publisher: PUBLISHER_SCHEMA,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_URL}/?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        }),
      },
    ],
  })
}
