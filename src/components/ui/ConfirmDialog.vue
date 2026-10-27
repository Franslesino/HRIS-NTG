<script setup lang="ts">
import AppIcon, { type IconName } from '@/components/AppIcon.vue'
import ModalShell from './ModalShell.vue'

defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  icon: IconName
}>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <ModalShell :open="open" :label="title" max-width="420px" @close="emit('close')">
    <div class="p-6">
      <div class="flex items-start justify-between">
        <span
          class="grid h-10 w-10 place-items-center rounded-full"
          :class="danger ? 'bg-amber-100 text-amber-500' : 'bg-brand-50 text-brand-500'"
        >
          <AppIcon :name="icon" :size="20" />
        </span>
        <button type="button" aria-label="Tutup" class="text-ink hover:text-brand-600" @click="emit('close')">
          <AppIcon name="close" :size="16" />
        </button>
      </div>
      <h2 class="mt-3 text-sm font-semibold">{{ title }}</h2>
      <p class="mt-2 text-sm text-ink-soft">{{ message }}</p>
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" class="btn btn-outline" @click="emit('close')">Batal</button>
        <button type="button" class="btn" :class="danger ? 'btn-danger' : 'btn-primary'" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </ModalShell>
</template>
