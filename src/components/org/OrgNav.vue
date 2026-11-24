<script setup lang="ts">
const tabs = [
  { to: '/organisasi', label: 'Struktur Unit' },
  { to: '/organisasi/jabatan', label: 'Master Jabatan' },
  { to: '/organisasi/kantor', label: 'Kantor & Lokasi' },
  { to: '/organisasi/jenis', label: 'Jenis & Referensi' },
]
</script>

<template>
  <nav class="overflow-x-auto print:hidden" aria-label="Bagian Organisasi & Jabatan">
    <div class="flex min-w-max gap-2 px-1">
      <RouterLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        class="inline-flex h-10 items-center rounded-lg px-4 text-sm text-ink-soft transition-colors hover:text-ink"
        exact-active-class="!bg-white !font-semibold !text-brand-600 shadow-sm"
      >
        {{ t.label }}
      </RouterLink>
    </div>
  </nav>
</template>
