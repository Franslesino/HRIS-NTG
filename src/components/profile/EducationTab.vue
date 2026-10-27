<script setup lang="ts">
import { computed } from 'vue'
import ReadonlyTable from './ReadonlyTable.vue'
import type { EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const columns = [
  { key: 'level', label: 'Jenjang', width: '80px' },
  { key: 'institution', label: 'Institusi', width: '1.6fr' },
  { key: 'major', label: 'Jurusan', width: '1.5fr' },
  { key: 'startYear', label: 'Tahun Masuk', width: '110px' },
  { key: 'endYear', label: 'Tahun Lulus', width: '110px' },
  { key: 'diplomaNumber', label: 'No. Ijazah', width: '1.5fr' },
]
const rows = computed(() => [...props.employee.educations].sort((a, b) => b.endYear.localeCompare(a.endYear)))
</script>

<template>
  <ReadonlyTable title="Data Riwayat Pendidikan Formal" :columns="columns" :rows="rows" empty-text="Riwayat pendidikan Anda belum tersedia.">
    <template #cell-level="{ row }"><span class="font-semibold">{{ row.level }}</span></template>
  </ReadonlyTable>
</template>
