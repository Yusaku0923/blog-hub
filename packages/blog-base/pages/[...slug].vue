<script setup lang="ts">
const route = useRoute()
const slugParam = route.params.slug
const path = '/' + (Array.isArray(slugParam) ? slugParam.join('/') : slugParam ?? '')

const { data: doc } = await useAsyncData(`doc-${path}`, () =>
  queryCollection('content').path(path).first(),
)

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const { data: children } = await useAsyncData(`children-${path}`, () => {
  if (doc.value?.pageType !== 'category') return Promise.resolve([])
  return queryCollection('content')
    .where('pageType', '=', 'article')
    .where('listed', '=', true)
    .where('draft', '=', false)
    .where('path', 'LIKE', `${path}/%`)
    .order('date', 'DESC')
    .all()
})

const { data: relatedRaw } = await useAsyncData(`related-${path}`, () => {
  if (doc.value?.pageType !== 'article') return Promise.resolve([])
  return queryCollection('content')
    .where('pageType', '=', 'article')
    .where('listed', '=', true)
    .where('draft', '=', false)
    .where('category', '=', doc.value!.category)
    .order('date', 'DESC')
    .limit(4)
    .all()
})

const related = computed(() => relatedRaw.value?.filter(a => a.path !== path).slice(0, 3) ?? [])

const siteUrl = useRuntimeConfig().public.siteUrl as string
const slugFlat = path.replace(/^\//, '').replace(/\//g, '-')
const ogImagePath = doc.value.heroImage ? `/og/${slugFlat}.webp` : '/og-default.png'

const pageTitle = `${doc.value.title} | ペットぐらし`

useSeoMeta({
  title: pageTitle,
  description: doc.value.description,
  ogTitle: pageTitle,
  ogDescription: doc.value.description,
  ogType: doc.value.pageType === 'article' ? 'article' : 'website',
  ogUrl: `${siteUrl}${path}`,
  ogImage: `${siteUrl}${ogImagePath}`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
})

const pathLabels: Record<string, string> = {
  dog: '犬',
  cat: '猫',
  compare: '比較',
  '100kin': '100均',
  column: 'コラム',
  daily: '毎日の暮らし',
  outing: 'お出かけ',
  health: '健康・介護',
  starter: 'はじめて飼う',
  furniture: '猫家具',
}

function buildBreadcrumb(p: string, title: string) {
  const parts = p.split('/').filter(Boolean)
  const items = [{ name: 'ホーム', url: siteUrl }]
  let acc = ''
  for (let i = 0; i < parts.length - 1; i++) {
    acc += '/' + parts[i]
    items.push({ name: pathLabels[parts[i]] ?? parts[i].toUpperCase(), url: `${siteUrl}${acc}` })
  }
  items.push({ name: title, url: `${siteUrl}${p}` })
  return items
}

if (doc.value.pageType === 'article') {
  useArticleStructuredData({
    title: doc.value.title,
    description: doc.value.description,
    datePublished: doc.value.created,
    dateModified: doc.value.date,
    author: '編集部',
    url: `${siteUrl}${path}`,
    ...(doc.value.heroImage && { image: `${siteUrl}${doc.value.heroImage}` }),
  })
}

if (doc.value.pageType === 'category' && children.value?.length) {
  useCollectionPageStructuredData({
    title: doc.value.title,
    description: doc.value.description,
    url: `${siteUrl}${path}`,
    items: children.value.map(a => ({
      title: a.title,
      url: `${siteUrl}${a.path}`,
      description: a.description,
    })),
  })
}

useBreadcrumbStructuredData(buildBreadcrumb(path, doc.value.title))

function fmt(d: Date | string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}

const breadcrumbs = computed(() => buildBreadcrumb(path, doc.value!.title))
</script>

<template>
  <div>
    <!-- Article -->
    <article v-if="doc?.pageType === 'article'" class="max-w-[720px] mx-auto px-6 pt-14">

      <!-- Breadcrumb nav -->
      <nav class="flex items-center gap-2 text-[12px] text-muted mb-8 flex-wrap bg-paper border border-line px-4 py-2.5 rounded-sm">
        <template v-for="(crumb, i) in breadcrumbs" :key="crumb.url">
          <NuxtLink v-if="i < breadcrumbs.length - 1" :to="crumb.url" class="hover:text-accent transition-colors duration-100 shrink-0">{{ crumb.name }}</NuxtLink>
          <span v-else class="text-ink/70 truncate max-w-[240px] font-medium">{{ crumb.name }}</span>
          <span v-if="i < breadcrumbs.length - 1" class="text-line shrink-0">›</span>
        </template>
      </nav>

      <div class="text-center text-[11px] tracking-[3px] text-accent mb-4 uppercase">
        FEATURE · {{ useCategoryLabel(doc.category).toUpperCase() }}
      </div>
      <h1 class="font-display text-[42px] leading-[1.25] tracking-[-0.5px] text-center mb-6">
        {{ doc.title }}
      </h1>
      <p class="font-display italic text-[18px] leading-[1.6] text-muted text-center mb-8">
        {{ doc.description }}
      </p>
      <div class="flex flex-col items-center gap-1.5 pb-8 border-b border-line">
        <div class="flex gap-5 text-[12px] text-muted tracking-[1px]">
          <span>BY ペットぐらし編集部</span>
          <span>·</span>
          <span>{{ fmt(doc.date) }}</span>
        </div>
        <div class="text-[11px] text-muted/70">ペット飼育歴10年以上 · 実使用レビュー</div>
      </div>

      <NuxtImg
        v-if="doc.heroImage"
        :src="doc.heroImage"
        :alt="doc.title"
        width="1600"
        height="900"
        format="webp"
        loading="eager"
        sizes="(max-width: 768px) 100vw, 720px"
        class="w-full aspect-[16/9] object-cover mt-10"
      />

      <div class="prose prose-petgurashi max-w-none mt-10">
        <ContentRenderer :value="doc" />
      </div>

      <div v-if="doc.tags?.length" class="pt-8 mt-10 border-t border-line flex gap-2 flex-wrap">
        <span v-for="t in doc.tags" :key="t" class="px-3.5 py-1.5 border border-line text-[11px] bg-paper">
          #{{ t }}
        </span>
      </div>

      <!-- Related articles -->
      <section v-if="related?.length" class="mt-14 pt-10 border-t border-line">
        <div class="text-[11px] tracking-[4px] text-muted mb-6 text-center">— 同じカテゴリの記事 —</div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NuxtLink
            v-for="a in related"
            :key="a.path"
            :to="a.path"
            class="group block border border-line bg-paper hover:border-accent transition-colors"
          >
            <div class="aspect-[5/3] bg-tag overflow-hidden">
              <NuxtImg
                v-if="a.heroImage"
                :src="a.heroImage"
                :alt="a.title"
                width="400"
                height="240"
                format="webp"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div class="p-4">
              <div class="text-[10px] text-accent tracking-[2px] mb-1.5">{{ useCategoryLabel(a.category).toUpperCase() }}</div>
              <div class="font-display text-[14px] leading-[1.5] text-ink group-hover:text-accent transition-colors line-clamp-3">{{ a.title }}</div>
              <div class="text-[11px] text-muted mt-2">{{ fmt(a.date) }}</div>
            </div>
          </NuxtLink>
        </div>
      </section>
    </article>

    <!-- Category -->
    <div v-else-if="doc?.pageType === 'category'">
      <section class="text-center px-10 pt-14 pb-10 border-b border-line">
        <div class="text-[11px] tracking-[4px] text-muted mb-2.5">
          CATEGORY — {{ children?.length ?? 0 }} ARTICLES
        </div>
        <h1 class="font-display text-[64px] leading-none tracking-[-1px] mb-4">
          {{ doc.title }}
        </h1>
        <p class="text-[14px] text-muted max-w-[540px] mx-auto leading-[1.7]">
          {{ doc.description }}
        </p>
      </section>
      <div v-if="doc.body" class="max-w-[720px] mx-auto px-10 py-10">
        <div class="prose prose-base max-w-none text-[15px] leading-[1.9] text-muted">
          <ContentRenderer :value="doc" />
        </div>
      </div>
      <section class="px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-9">
        <ArticleCard
          v-for="a in children"
          :key="a.path"
          :to="a.path"
          :title="a.title"
          :excerpt="a.description"
          :category-label="useCategoryLabel(a.category).toUpperCase()"
          author="編集部"
          :date="fmt(a.date)"
          :image="a.heroImage"
        />
      </section>
    </div>
  </div>
</template>
