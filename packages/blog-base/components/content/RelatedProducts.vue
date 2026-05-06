<template>
  <section class="my-12 px-10 py-12 bg-paper -mx-6 md:-mx-10">
    <div class="text-center mb-7">
      <div class="text-[11px] tracking-[4px] text-muted mb-1.5">— YOU MAY ALSO LIKE —</div>
      <div class="font-display text-[24px] italic">関連する商品</div>
    </div>
    <div class="max-w-[900px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <a
        v-for="p in items"
        :key="p.name"
        :href="p.url"
        rel="sponsored nofollow noopener"
        target="_blank"
        class="group block border border-line bg-paper hover:border-accent hover:shadow-md transition-all duration-200 rounded-sm overflow-hidden"
      >
        <div
          class="aspect-[4/3] bg-tag overflow-hidden"
          :style="p.image ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover' } : undefined"
        />
        <div class="p-3.5">
          <div class="text-[10px] text-accent tracking-[2px] uppercase mb-1.5 font-semibold">{{ p.category }}</div>
          <div class="font-display text-[15px] leading-[1.4] group-hover:text-accent transition-colors duration-150">{{ p.name }}</div>
          <div class="mt-3 text-[11px] font-semibold text-accent tracking-[1px]">詳細を見る →</div>
        </div>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
interface RelatedItem {
  name: string
  url: string
  category: string
  image?: string
}
defineProps<{ items: RelatedItem[] }>()
</script>
