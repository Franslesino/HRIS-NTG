<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{ label: string; options: string[]; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div
    class="relative inline-flex h-[42px] items-center gap-2 rounded-md border border-line bg-white px-3.5 text-sm focus-within:outline focus-within:outline-2 focus-within:outline-brand-500"
  >
    <span class="whitespace-nowrap">{{ label }}: {{ modelValue }}</span>
    <AppIcon name="chevron-down" :size="14" />
    <!-- select asli di atas teks agar tetap aksesibel -->
    <select
      class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      :aria-label="label"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="Semua">Semua</option>
      <option v-for="o in options" :key="o" :value="o">{{ o }}</option>
    </select>
  </div>
</template>
