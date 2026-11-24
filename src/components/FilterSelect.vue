<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  label: string
  options: { value: string; label: string }[]
  modelValue: string // '' = Semua
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const current = computed(() => props.options.find((o) => o.value === props.modelValue)?.label ?? 'Semua')
</script>

<template>
  <div
    class="relative inline-flex h-[42px] max-w-full items-center gap-2 rounded-md border border-line bg-white px-3.5 text-sm focus-within:outline focus-within:outline-2 focus-within:outline-brand-500"
  >
    <span class="truncate whitespace-nowrap">{{ label }}: {{ current }}</span>
    <AppIcon name="chevron-down" :size="14" />
    <!-- select asli di atas teks agar tetap aksesibel -->
    <select
      class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      :aria-label="label"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">Semua</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>
</template>
