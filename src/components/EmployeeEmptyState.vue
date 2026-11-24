<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{ keyword: string }>()
</script>

<template>
  <div class="flex min-h-[320px] flex-col items-center justify-center px-4 py-12 text-center">
    <span class="text-ink-soft"><AppIcon name="folder-open" :size="36" /></span>
    <h2 class="mt-3 text-base font-semibold">Tidak ada hasil pencarian</h2>
    <p v-if="keyword" class="mt-1 max-w-xl text-sm text-ink-soft">
      Tidak ada pegawai yang cocok dengan “{{ keyword }}”. Coba kata kunci lain atau ubah filter pencarian.
    </p>
    <p v-else class="mt-1 max-w-xl text-sm text-ink-soft">
      Tidak ada pegawai yang cocok dengan filter yang dipilih. Coba ubah filter pencarian.
    </p>
  </div>
</template>
