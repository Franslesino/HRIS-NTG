<script setup lang="ts">
import BaseModal from './BaseModal.vue'

defineProps<{ open: boolean; title: string; items: { label: string; value: string }[] }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <BaseModal :open="open" :title="title" @close="emit('close')">
    <dl class="space-y-4">
      <div v-for="i in items" :key="i.label">
        <dt class="text-xs text-ink-soft">{{ i.label }}</dt>
        <dd class="text-sm">{{ i.value }}</dd>
      </div>
    </dl>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="emit('close')">Tutup</button>
    </template>
  </BaseModal>
</template>
