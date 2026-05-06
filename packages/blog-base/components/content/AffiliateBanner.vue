<template>
  <div class="my-10 border border-line bg-paper overflow-hidden">
    <!-- Header -->
    <div class="flex justify-between items-center px-5 pt-4 pb-3 border-b border-line">
      <div class="text-[10px] tracking-[3px] text-accent">— DOG FOOD —</div>
      <span class="text-[10px] text-muted tracking-[1px]">PR · アフィリエイト</span>
    </div>

    <!-- Body -->
    <div class="p-5 flex flex-col sm:flex-row gap-6 items-start">
      <!-- Banner image -->
      <a
        :href="href"
        rel="nofollow sponsored noopener"
        target="_blank"
        class="shrink-0 block hover:opacity-90 transition-opacity"
      >
        <img
          :src="imgSrc"
          :alt="name"
          width="300"
          height="250"
          class="w-[160px] h-auto border border-line"
        />
      </a>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-[16px] leading-snug mb-2.5">{{ name }}</div>
        <p v-if="description" class="text-[13px] text-muted leading-[1.8] mb-3">
          {{ description }}
        </p>
        <ul v-if="features?.length" class="space-y-1.5 mb-5">
          <li
            v-for="f in features"
            :key="f"
            class="text-[12px] flex items-start gap-2 text-ink"
          >
            <span class="text-accent shrink-0 mt-[2px] font-bold">—</span>
            <span>{{ f }}</span>
          </li>
        </ul>
        <a
          :href="href"
          rel="nofollow sponsored noopener"
          target="_blank"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-paper text-[11px] tracking-[2px] hover:opacity-80 transition-opacity"
        >
          詳しく見る
          <span class="text-[10px]">→</span>
        </a>
      </div>
    </div>

    <!-- Tracking pixel -->
    <img
      v-if="trackingSrc"
      :src="trackingSrc"
      width="1"
      height="1"
      alt=""
      class="absolute w-px h-px opacity-0 pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  href: string
  imgSrc: string
  trackingSrc?: string
  description?: string
  features?: string[]
}>()
</script>
