<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from 'lucide-vue-next'

withDefaults(defineProps<{
  title: string
  description?: string
  icon?: Component
}>(), {
  // Factory: functional icon components (lucide) must not be used directly as a
  // prop default, otherwise Vue invokes them without a render context.
  icon: () => Inbox,
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
    <div class="flex size-10 items-center justify-center rounded-full bg-muted">
      <component :is="icon" class="size-5 text-muted-foreground" />
    </div>
    <div class="space-y-1">
      <p class="text-sm font-medium">{{ title }}</p>
      <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>
