<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'

defineProps<{
  label: string
  forId?: string
  required?: boolean
  error?: string
  hint?: string
  select?: boolean
}>()
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1.5">
    <label :for="forId" class="text-xs font-semibold">
      {{ label }}<span v-if="required" class="ml-0.5 text-red-500">*</span>
    </label>
    <div class="relative">
      <slot />
      <span
        v-if="error"
        class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-red-500"
        :class="select ? 'right-9' : 'right-3'"
      >
        <AppIcon name="alert-circle" :size="16" />
      </span>
    </div>
    <p v-if="error" class="text-xs text-red-600" role="alert">{{ error }}</p>
    <p v-if="hint" class="text-xs text-ink-soft">{{ hint }}</p>
  </div>
</template>
