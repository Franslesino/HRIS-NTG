<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

const props = defineProps<{ open: boolean; label: string; maxWidth?: string }>()
const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
      @mousedown.self="emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        class="w-full rounded-xl bg-white shadow-xl"
        :style="{ maxWidth: maxWidth ?? '600px' }"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
