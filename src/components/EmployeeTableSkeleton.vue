<script setup lang="ts">
import { ROW_GRID } from './tableLayout'
defineProps<{ rows: number }>()
</script>

<template>
  <div role="status" aria-label="Memuat data pegawai" class="animate-pulse">
    <div v-for="n in rows" :key="n" :class="[ROW_GRID, 'h-16 border-b border-line last:border-b-0']">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
        <div class="w-full space-y-1.5">
          <div class="h-2.5 w-4/5 rounded bg-gray-200" />
          <div class="h-2 w-1/2 rounded bg-gray-200" />
        </div>
      </div>
      <div class="h-3 w-4/5 rounded bg-gray-100" />
      <div class="h-3 w-4/5 rounded bg-gray-100" />
      <div class="h-3 w-3/4 rounded bg-gray-100" />
      <div class="h-3 w-12 rounded bg-gray-100" />
      <div class="flex justify-end gap-2">
        <div class="h-9 w-9 rounded-md bg-gray-100" />
        <div class="h-9 w-9 rounded-md bg-gray-200" />
      </div>
    </div>
  </div>
</template>
