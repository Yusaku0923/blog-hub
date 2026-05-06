<script setup lang="ts">
const route = useRoute()
const siteUrl = useRuntimeConfig().public.siteUrl as string
useSeoMeta({
  ogImage: `${siteUrl}/og-default.png`,
  twitterCard: 'summary_large_image',
})
useHead({
  link: [{ rel: 'canonical', href: computed(() => `${siteUrl}${route.path}`) }],
})
</script>

<template>
  <div class="min-h-screen bg-bg text-ink font-body flex flex-col pb-16 md:pb-0">
    <slot name="header" />
    <main class="flex-1"><slot /></main>
    <slot name="footer" />
    <slot name="mobile" />
  </div>
</template>
