<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import ModalShell from './ModalShell.vue'

defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <ModalShell :open="open" :label="title" @close="emit('close')">
    <header class="flex items-center justify-between border-b border-line px-6 py-4">
      <h2 class="text-base font-semibold">{{ title }}</h2>
      <button type="button" class="text-ink hover:text-brand-600" aria-label="Tutup" @click="emit('close')">
        <AppIcon name="close" :size="18" />
      </button>
    </header>
    <div class="px-6 py-5"><slot /></div>
    <footer v-if="$slots.footer" class="flex justify-end gap-2 border-t border-line px-6 py-4">
      <slot name="footer" />
    </footer>
  </ModalShell>
</template>
