<template>
  <section>
    <h2 class="font-display text-[28px] tracking-[-0.3px] my-10">よくある質問</h2>
    <div
      v-for="(item, i) in items"
      :key="i"
      class="py-4 border-b border-line"
    >
      <div class="flex gap-2.5 items-baseline mb-1.5">
        <span class="font-display text-accent text-[16px]">Q.</span>
        <div class="font-medium text-[15px]">{{ item.q }}</div>
      </div>
      <div class="flex gap-2.5 items-baseline">
        <span class="font-display text-muted text-[16px]">A.</span>
        <div class="text-[14px] text-muted leading-[1.8]">{{ item.a }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface FaqItem { q: string; a: string }
const props = defineProps<{ items: FaqItem[] }>()

useHead({
  script: [
    {
      key: 'structured-data-faq',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: props.items.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      }),
    },
  ],
})
</script>
