<script setup lang="ts">
import { computed } from 'vue'
import ReadonlyTable from './ReadonlyTable.vue'
import { formatDate } from '@/utils/format'
import type { EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const columns = [
  { key: 'relation', label: 'Hubungan', width: '1.1fr' },
  { key: 'name', label: 'Nama', width: '1.5fr' },
  { key: 'nik', label: 'NIK', width: '1.5fr' },
  { key: 'birthDate', label: 'Tanggal Lahir', width: '120px' },
  { key: 'occupation', label: 'Pekerjaan', width: '1.3fr' },
  { key: 'dependent', label: 'Tanggungan', width: '110px' },
]
const rows = computed(() => props.employee.family)
</script>

<template>
  <ReadonlyTable title="Data Anggota Keluarga" :columns="columns" :rows="rows" empty-text="Data anggota keluarga Anda belum tersedia.">
    <template #cell-relation="{ row }"><span class="font-semibold">{{ row.relation }}</span></template>
    <template #cell-birthDate="{ row }">{{ formatDate(row.birthDate) }}</template>
    <template #cell-dependent="{ row }">
      <span
        class="inline-block rounded border px-2 py-0.5 text-xs"
        :class="row.dependent ? 'border-brand-100 bg-brand-50 text-brand-700' : 'border-line bg-surface text-ink-soft'"
      >
        {{ row.dependent ? 'Ya' : 'Tidak' }}
      </span>
    </template>
  </ReadonlyTable>
</template>
