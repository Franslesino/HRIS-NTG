<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
defineProps<{ label: string }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
    :class="model ? 'bg-brand-500' : 'bg-gray-300'"
    @click="model = !model"
  >
    <span
      class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
      :class="model && 'translate-x-5'"
    />
  </button>
</template>
