<script setup lang="ts">
import { computed } from 'vue'
import ReadonlyTable from './ReadonlyTable.vue'
import { maskAccountShort } from '@/utils/format'
import type { EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const columns = [
  { key: 'bank', label: 'Nama Bank', width: '1.2fr' },
  { key: 'accountNumber', label: 'No. Rekening', width: '1.5fr' },
  { key: 'ownerName', label: 'Nama Pemilik', width: '1.5fr' },
  { key: 'primary', label: 'Status', width: '1.2fr' },
]
const rows = computed(() => props.employee.banks)
</script>

<template>
  <ReadonlyTable title="Daftar Rekening Bank Pegawai" :columns="columns" :rows="rows" empty-text="Rekening bank Anda belum tersedia.">
    <template #cell-bank="{ row }"><span class="font-semibold">{{ row.bank }}</span></template>
    <template #cell-accountNumber="{ row }">{{ maskAccountShort(row.accountNumber) }}</template>
    <template #cell-primary="{ row }">
      <span
        class="inline-block rounded border px-2 py-0.5 text-xs"
        :class="row.primary ? 'border-brand-100 bg-brand-50 font-semibold text-brand-700' : 'border-line bg-surface text-ink-soft'"
      >
        {{ row.primary ? 'Rekening Utama' : 'Cadangan' }}
      </span>
    </template>
  </ReadonlyTable>
</template>
