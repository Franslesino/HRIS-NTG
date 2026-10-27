<script setup lang="ts">
import { computed } from 'vue'
import ReadonlyTable from './ReadonlyTable.vue'
import { formatDate } from '@/utils/format'
import type { EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const columns = [
  { key: 'position', label: 'Jabatan', width: '1.7fr' },
  { key: 'unit', label: 'Unit Kerja', width: '1.6fr' },
  { key: 'startDate', label: 'Tanggal Mulai', width: '120px' },
  { key: 'endDate', label: 'Tanggal Selesai', width: '130px' },
  { key: 'skNumber', label: 'No. SK', width: '1.3fr' },
]
const rows = computed(() => [...props.employee.jobHistory].sort((a, b) => b.startDate.localeCompare(a.startDate)))
</script>

<template>
  <ReadonlyTable title="Data Riwayat Jabatan & Pekerjaan" :columns="columns" :rows="rows" empty-text="Riwayat jabatan dan pekerjaan Anda belum tersedia.">
    <template #cell-position="{ row }">
      <span class="flex flex-wrap items-center gap-2 font-semibold">
        {{ row.position }}
        <span v-if="!row.endDate" class="rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">Saat Ini</span>
      </span>
    </template>
    <template #cell-startDate="{ row }">{{ formatDate(row.startDate) }}</template>
    <template #cell-endDate="{ row }">{{ row.endDate ? formatDate(row.endDate) : 'Sekarang' }}</template>
  </ReadonlyTable>
</template>
