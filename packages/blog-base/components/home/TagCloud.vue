<script setup lang="ts">
const props = withDefaults(defineProps<{
  limit?: number
}>(), {
  limit: 50,
})

const { data: tags } = await useAsyncData('all-tags', async () => {
  const articles = await queryCollection('content')
    .where('pageType', '=', 'article')
    .where('listed', '=', true)
    .where('draft', '=', false)
    .all()
  const counts = new Map<string, number>()
  for (const a of articles) {
    for (const t of a.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, props.limit)
    .map(([tag, count]) => ({ tag, count }))
})
</script>

<template>
  <section class="px-10 py-10">
    <div class="flex gap-2 flex-wrap">
      <NuxtLink
        v-for="t in tags"
        :key="t.tag"
        :to="`/tag/${encodeURIComponent(t.tag)}`"
        class="px-3.5 py-1.5 border border-line text-[11px] bg-paper hover:bg-tag"
      >
        #{{ t.tag }}
        <span class="text-muted ml-1">{{ t.count }}</span>
      </NuxtLink>
    </div>
  </section>
</template>
