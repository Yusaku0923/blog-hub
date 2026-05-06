<template>
  <aside class="my-10 p-7 bg-paper border border-line">
    <div class="flex justify-between items-baseline mb-4">
      <div>
        <div class="text-[10px] tracking-[3px] text-accent mb-1">— EDITOR'S PICK —</div>
        <div class="font-display text-[24px]">{{ title ?? 'おすすめ3選' }}</div>
      </div>
      <span class="text-[10px] text-muted tracking-[1px]">PR · アフィリエイト</span>
    </div>
    <div
      v-for="(p, i) in items"
      :key="p.name"
      class="grid grid-cols-[40px_90px_1fr_auto] gap-4 items-center py-4"
      :class="i === 0 ? '' : 'border-t border-line'"
    >
      <div class="font-display text-[32px] text-accent leading-none">{{ i + 1 }}</div>
      <div
        class="aspect-square bg-tag"
        :style="p.image ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover' } : undefined"
      />
      <div>
        <div class="font-semibold text-[14px] mb-1">{{ p.name }}</div>
        <div class="text-[11px] text-accent mb-0.5">
          {{ '★'.repeat(Math.floor(p.rating)) }}<span class="text-line">{{ '★'.repeat(5 - Math.floor(p.rating)) }}</span>
          <span class="text-ink">{{ p.rating }}</span>
        </div>
        <div class="text-[11px] text-muted">{{ p.reviews }}件のレビュー</div>
      </div>
      <div class="text-right">
        <div class="font-display text-[20px] text-ink mb-2">{{ p.price }}</div>
        <div class="flex flex-col gap-1.5">
          <a
            v-if="p.amazonUrl"
            :href="p.amazonUrl"
            rel="sponsored nofollow noopener"
            target="_blank"
            class="px-4 py-2 bg-accent text-paper text-[11px] font-semibold tracking-[1px] whitespace-nowrap text-center hover:bg-[#7a5234] transition-colors duration-150 shadow-sm"
          >Amazonで見る</a>
          <a
            v-if="p.rakutenUrl"
            :href="p.rakutenUrl"
            rel="sponsored nofollow noopener"
            target="_blank"
            class="px-4 py-2 bg-transparent text-accent border-2 border-accent text-[11px] font-semibold tracking-[1px] whitespace-nowrap text-center hover:bg-accent/10 transition-colors duration-150"
          >楽天で見る</a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface CompareItem {
  name: string
  price: string
  rating: number
  reviews: number
  image?: string
  amazonUrl?: string
  rakutenUrl?: string
}

const props = defineProps<{
  title?: string
  items: CompareItem[]
}>()

useHead({
  script: [
    {
      key: 'structured-data-product-compare',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: props.items.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: p.name,
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: p.rating,
              reviewCount: p.reviews,
            },
          },
        })),
      }),
    },
  ],
})
</script>
