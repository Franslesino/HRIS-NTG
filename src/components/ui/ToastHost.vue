<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <div class="pointer-events-none fixed right-4 top-20 z-[60] flex flex-col gap-2 sm:right-6" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        role="status"
        class="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-line bg-white px-4 py-3 text-sm shadow-lg"
      >
        <span class="text-emerald-500"><AppIcon name="check-circle" :size="18" /></span>
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: opacity .2s, transform .2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-6px); }
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active, .toast-leave-active { transition: none; }
}
</style>
