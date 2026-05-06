<script setup lang="ts">
const props = withDefaults(defineProps<{
  limit?: number
  category?: string
}>(), {
  limit: 6,
})

const { data: articles } = await useAsyncData(
  `latest-articles-${props.category ?? 'all'}-${props.limit}`,
  () => {
    let q = queryCollection('content')
      .where('pageType', '=', 'article')
      .where('listed', '=', true)
      .where('draft', '=', false)
    if (props.category) q = q.where('category', '=', props.category)
    return q.order('date', 'DESC').limit(props.limit).all()
  },
)

function fmt(d: Date | string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <section class="px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-9">
    <ArticleCard
      v-for="a in articles"
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
</template>
