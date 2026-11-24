<script setup lang="ts">
import type { StatusTone } from '@/utils/employee'

defineProps<{ label: string; tone: StatusTone }>()

const styles: Record<StatusTone, string> = {
  ok: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  warn: 'border-amber-400 bg-amber-50 text-amber-600',
  off: 'border-red-500 bg-red-50 text-red-600',
}
</script>

<template>
  <span
    class="inline-block rounded border px-2 py-0.5 text-xs font-semibold leading-tight"
    :class="styles[tone]"
  >
    {{ label }}
  </span>
</template>
