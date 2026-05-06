<template>
  <article class="group border border-line bg-paper hover:border-accent hover:shadow-md transition-all duration-200 rounded-sm overflow-hidden">
    <NuxtLink :to="to" class="block">
      <div class="aspect-[4/3] w-full bg-tag overflow-hidden">
        <NuxtImg
          v-if="image"
          :src="image"
          :alt="title"
          width="600"
          height="450"
          format="webp"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 33vw"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div v-else class="w-full h-full bg-tag flex items-center justify-center">
          <span class="text-muted/40 text-[11px] tracking-[2px]">NO IMAGE</span>
        </div>
      </div>
      <div class="p-4">
        <div class="inline-block px-2.5 py-1 bg-accent/10 text-accent text-[10px] font-semibold tracking-[2px] uppercase mb-2.5 rounded-sm">
          {{ categoryLabel }}
        </div>
        <h3 class="font-display text-[18px] leading-[1.45] font-normal mb-2.5 group-hover:text-accent transition-colors duration-150">
          {{ title }}
        </h3>
        <p v-if="excerpt" class="text-[13px] leading-[1.7] text-muted mb-3.5 line-clamp-2">
          {{ excerpt }}
        </p>
        <div class="text-[11px] text-muted tracking-[1px] pt-2.5 border-t border-line flex justify-between">
          <span>{{ author }}</span>
          <span>{{ date }}</span>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  to: string
  title: string
  excerpt?: string
  categoryLabel: string
  author: string
  date: string
  image?: string
}>()
</script>
