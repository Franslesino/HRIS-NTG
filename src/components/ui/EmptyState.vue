<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'

defineProps<{ title: string; description: string }>()
</script>

<template>
  <div class="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">
    <span class="text-ink-soft"><AppIcon name="folder-open" :size="36" /></span>
    <h3 class="mt-3 text-base font-semibold">{{ title }}</h3>
    <p class="mt-1 max-w-xl text-sm text-ink-soft">{{ description }}</p>
    <div class="mt-4"><slot /></div>
  </div>
</template>
