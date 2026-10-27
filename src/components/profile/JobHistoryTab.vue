<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import RecordTable from '@/components/ui/RecordTable.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import FormModal from '@/components/ui/FormModal.vue'
import FormField from '@/components/ui/FormField.vue'
import { useRecordModal } from '@/composables/useRecordModal'
import { useToast } from '@/composables/useToast'
import { employeeStore } from '@/stores/employeeStore'
import { formatDate, orDash } from '@/utils/format'
import { isBlank } from '@/utils/validators'
import { uid } from '@/utils/id'
import type { EmployeeDetail, JobHistory } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const { show } = useToast()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<JobHistory>()

const columns = [
  { key: 'position', label: 'Jabatan', width: '1.6fr' },
  { key: 'unit', label: 'Unit Kerja', width: '1.5fr' },
  { key: 'startDate', label: 'Tanggal Mulai', width: '110px' },
  { key: 'endDate', label: 'Tanggal Selesai', width: '120px' },
  { key: 'skNumber', label: 'No. SK', width: '1.2fr' },
]
const rows = computed(() =>
  [...props.employee.jobHistory].sort((a, b) => b.startDate.localeCompare(a.startDate)),
)

const blank = () => ({ position: '', unit: '', startDate: '', endDate: '', skNumber: '' })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r ? { position: r.position, unit: r.unit, startDate: r.startDate, endDate: r.endDate, skNumber: r.skNumber } : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (isBlank(form.position)) e.position = 'Jabatan wajib diisi.'
  if (isBlank(form.unit)) e.unit = 'Unit kerja wajib diisi.'
  if (!form.startDate) e.startDate = 'Tanggal mulai wajib diisi.'
  if (form.endDate && form.startDate && form.endDate < form.startDate)
    e.endDate = 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
  if (isBlank(form.skNumber)) e.skNumber = 'Nomor SK wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) return
  employeeStore.saveRecord(props.employee.id, 'jobHistory', {
    id: record.value?.id ?? uid(),
    position: form.position.trim(), unit: form.unit.trim(),
    startDate: form.startDate, endDate: form.endDate, skNumber: form.skNumber.trim(),
  })
  show(mode.value === 'create' ? 'Data pegawai berhasil disimpan' : 'Data pegawai berhasil diperbarui')
  close()
}

const detail = computed(() => {
  const r = record.value
  return r
    ? [
        { label: 'Jabatan', value: r.position },
        { label: 'Unit Kerja', value: r.unit },
        { label: 'Tanggal Mulai', value: formatDate(r.startDate) },
        { label: 'Tanggal Selesai', value: r.endDate ? formatDate(r.endDate) : 'Sekarang' },
        { label: 'Nomor SK', value: orDash(r.skNumber) },
      ]
    : []
})
const isForm = computed(() => mode.value === 'create' || mode.value === 'edit')
</script>

<template>
  <RecordTable
    title="Data Riwayat Jabatan & Pekerjaan"
    :columns="columns"
    :rows="rows"
    empty-text="Riwayat jabatan dan pekerjaan pegawai belum ditambahkan."
    @add="openCreate" @view="openView" @edit="openEdit"
  >
    <template #cell-position="{ row }">
      <span class="flex flex-wrap items-center gap-2" :class="!row.endDate && 'font-semibold'">
        {{ row.position }}
        <span v-if="!row.endDate" class="rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">Saat Ini</span>
      </span>
    </template>
    <template #cell-startDate="{ row }">{{ formatDate(row.startDate) }}</template>
    <template #cell-endDate="{ row }">
      <span :class="!row.endDate && 'font-semibold'">{{ row.endDate ? formatDate(row.endDate) : 'Sekarang' }}</span>
    </template>
  </RecordTable>

  <DetailModal :open="mode === 'view'" title="Detail Riwayat Jabatan/Pekerjaan" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Edit Riwayat Pekerjaan' : 'Tambah Riwayat Pekerjaan'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close" @submit="submit"
  >
    <FormField label="Jabatan" for-id="jh-position" required :error="errors.position">
      <input id="jh-position" v-model="form.position" class="input" placeholder="Masukkan jabatan" :aria-invalid="!!errors.position" />
    </FormField>
    <FormField label="Unit Kerja" for-id="jh-unit" required :error="errors.unit">
      <input id="jh-unit" v-model="form.unit" class="input" placeholder="Masukkan unit kerja" :aria-invalid="!!errors.unit" />
    </FormField>
    <FormField label="Tanggal Mulai" for-id="jh-start" required :error="errors.startDate">
      <input id="jh-start" v-model="form.startDate" type="date" class="input" :aria-invalid="!!errors.startDate" />
    </FormField>
    <FormField label="Tanggal Selesai" for-id="jh-end" :error="errors.endDate" hint="Kosongkan jika masih menjabat.">
      <input id="jh-end" v-model="form.endDate" type="date" class="input" :aria-invalid="!!errors.endDate" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Nomor SK" for-id="jh-sk" required :error="errors.skNumber">
        <input id="jh-sk" v-model="form.skNumber" class="input" placeholder="Masukkan nomor SK" :aria-invalid="!!errors.skNumber" />
      </FormField>
    </div>
  </FormModal>
</template>
