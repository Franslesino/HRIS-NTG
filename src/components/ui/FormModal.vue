<script setup lang="ts">
import BaseModal from './BaseModal.vue'

defineProps<{ open: boolean; title: string; submitLabel: string }>()
const emit = defineEmits<{ close: []; submit: [] }>()
</script>

<template>
  <BaseModal :open="open" :title="title" @close="emit('close')">
    <form id="record-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="emit('submit')">
      <slot />
    </form>
    <template #footer>
      <button type="button" class="btn btn-outline" @click="emit('close')">Batal</button>
      <button type="submit" form="record-form" class="btn btn-primary">{{ submitLabel }}</button>
    </template>
  </BaseModal>
</template>
