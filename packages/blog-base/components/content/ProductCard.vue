<template>
  <div class="my-8 bg-paper border-2 border-line rounded-sm shadow-sm hover:shadow-md hover:border-accent transition-all duration-200">
    <div class="flex justify-between items-baseline px-5 pt-4 pb-2">
      <div class="text-[10px] tracking-[3px] text-accent font-semibold">— PRODUCT —</div>
      <span class="text-[10px] text-muted tracking-[1px]">PR · アフィリエイト</span>
    </div>
    <div class="px-5 pb-5">
      <!-- 上段：画像 + 商品情報 -->
      <div class="flex gap-5 items-start mb-4">
        <component
          :is="amazonUrl || rakutenUrl ? 'a' : 'div'"
          v-bind="(amazonUrl || rakutenUrl) ? { href: amazonUrl || rakutenUrl, rel: 'sponsored nofollow noopener', target: '_blank' } : {}"
          class="aspect-square w-24 shrink-0 bg-tag block hover:opacity-80 transition-opacity rounded-sm overflow-hidden"
          :style="image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined"
        />
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-[15px] leading-[1.4] mb-2">{{ name }}</div>
          <div class="text-[12px] text-accent mb-0.5">
            {{ '★'.repeat(Math.floor(rating)) }}<span class="text-line">{{ '★'.repeat(5 - Math.floor(rating)) }}</span>
            <span class="ml-1 text-ink font-semibold">{{ rating }}</span>
          </div>
          <div class="text-[11px] text-muted">{{ reviews }}件のレビュー</div>
        </div>
      </div>
      <!-- 価格 -->
      <div class="mb-4 text-center">
        <div class="font-display text-[28px] text-ink tracking-[-0.5px]">{{ price }}</div>
        <div class="text-[10px] text-muted mt-0.5">（税込・送料別途）</div>
      </div>
      <!-- CTAボタン群 -->
      <div class="flex flex-col gap-2.5">
        <a
          v-if="amazonUrl"
          :href="amazonUrl"
          rel="sponsored nofollow noopener"
          target="_blank"
          class="block w-full py-3 bg-accent text-paper text-[13px] font-semibold tracking-[2px] text-center hover:bg-[#7a5234] active:bg-[#6b4729] transition-colors duration-150 shadow-sm"
        >Amazonで見る</a>
        <a
          v-if="rakutenUrl"
          :href="rakutenUrl"
          rel="sponsored nofollow noopener"
          target="_blank"
          class="block w-full py-2.5 bg-transparent text-accent border-2 border-accent text-[13px] font-semibold tracking-[1px] text-center hover:bg-accent/10 active:bg-accent/20 transition-colors duration-150"
        >楽天市場で見る</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string
  price: string
  rating: number
  reviews: number
  image?: string
  amazonUrl?: string
  rakutenUrl?: string
  description?: string
}>()

const priceNumeric = props.price.replace(/[¥,￥\s]/g, '')
const offerUrl = props.amazonUrl || props.rakutenUrl

useHead({
  script: [
    {
      key: `structured-data-product-${props.name}`,
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: props.name,
        ...(props.description && { description: props.description }),
        ...(props.image && { image: props.image }),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: props.rating,
          bestRating: 5,
          worstRating: 1,
          reviewCount: props.reviews,
        },
        ...(priceNumeric && {
          offers: {
            '@type': 'Offer',
            price: priceNumeric,
            priceCurrency: 'JPY',
            availability: 'https://schema.org/InStock',
            ...(offerUrl && { url: offerUrl }),
          },
        }),
      }),
    },
  ],
})
</script>
