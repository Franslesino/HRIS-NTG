<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ page: number; totalPages: number; disabled?: boolean }>()
const emit = defineEmits<{ change: [page: number] }>()

// 1 2 3 … 8 — dengan elipsis bila halaman banyak
const pages = computed<(number | '…')[]>(() => {
  const { page, totalPages: n } = props
  if (n <= 5) return Array.from({ length: n }, (_, i) => i + 1)
  const set = new Set([1, n, page - 1, page, page + 1])
  if (page <= 2) { set.add(2); set.add(3) }
  if (page >= n - 1) { set.add(n - 1); set.add(n - 2) }
  const sorted = [...set].filter((p) => p >= 1 && p <= n).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
})

const base = 'h-8 min-w-8 rounded border px-2.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50'
</script>

<template>
  <nav class="flex items-center gap-1.5" aria-label="Paginasi">
    <button
      type="button"
      :class="[base, 'border-line bg-white hover:bg-surface']"
      :disabled="disabled || page <= 1"
      @click="emit('change', page - 1)"
    >
      Sebelumnya
    </button>

    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === '…'" class="px-1 text-xs text-ink-soft">…</span>
      <button
        v-else
        type="button"
        :class="[
          base,
          p === page
            ? 'border-brand-500 bg-brand-500 font-semibold text-white'
            : 'border-line bg-white hover:bg-surface',
        ]"
        :disabled="disabled"
        :aria-current="p === page ? 'page' : undefined"
        @click="emit('change', p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      type="button"
      :class="[base, 'border-line bg-white hover:bg-surface']"
      :disabled="disabled || page >= totalPages"
      @click="emit('change', page + 1)"
    >
      Berikutnya
    </button>
  </nav>
</template>
