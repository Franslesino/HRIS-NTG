<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import RecordTable from '@/components/ui/RecordTable.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import FormModal from '@/components/ui/FormModal.vue'
import FormField from '@/components/ui/FormField.vue'
import { api } from '@/api'
import { useApiErrors } from '@/composables/useApiErrors'
import { useRecordModal } from '@/composables/useRecordModal'
import { useToast } from '@/composables/useToast'
import { formatDate, orDash } from '@/utils/format'
import { isBlank } from '@/utils/validators'
import type { EmployeeDetail, WorkHistory, WorkHistoryInput } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const emit = defineEmits<{ refresh: [] }>()
const { show } = useToast()
const { apply } = useApiErrors()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<WorkHistory>()

const columns = [
  { key: 'employerName', label: 'Perusahaan / Instansi', width: '1.6fr' },
  { key: 'positionName', label: 'Jabatan', width: '1.4fr' },
  { key: 'startDate', label: 'Tanggal Mulai', width: '110px' },
  { key: 'endDate', label: 'Tanggal Selesai', width: '120px' },
]
const rows = computed(() => props.employee.workHistories)

const blank = (): WorkHistoryInput => ({ employerName: '', positionName: '', startDate: '', endDate: '', description: '' })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const saving = ref(false)

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r
      ? { employerName: r.employerName, positionName: r.positionName, startDate: r.startDate, endDate: r.endDate, description: r.description }
      : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (isBlank(form.employerName)) e.employerName = 'Nama perusahaan/instansi wajib diisi.'
  if (isBlank(form.positionName)) e.positionName = 'Jabatan wajib diisi.'
  if (!form.startDate) e.startDate = 'Tanggal mulai wajib diisi.'
  if (form.endDate && form.startDate && form.endDate < form.startDate) e.endDate = 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  if (saving.value || !validate()) return
  saving.value = true
  try {
    await api.saveWorkHistory(props.employee.id, { ...form }, record.value?.id)
    show(mode.value === 'create' ? 'Data pegawai berhasil disimpan' : 'Data pegawai berhasil diperbarui')
    close()
    emit('refresh')
  } catch (err) {
    apply(err, errors)
  } finally {
    saving.value = false
  }
}

const detail = computed(() => {
  const r = record.value
  return r
    ? [
        { label: 'Perusahaan / Instansi', value: r.employerName },
        { label: 'Jabatan', value: r.positionName },
        { label: 'Tanggal Mulai', value: formatDate(r.startDate) },
        { label: 'Tanggal Selesai', value: r.endDate ? formatDate(r.endDate) : 'Sekarang' },
        { label: 'Deskripsi', value: orDash(r.description) },
      ]
    : []
})
const isForm = computed(() => mode.value === 'create' || mode.value === 'edit')
</script>

<template>
  <RecordTable
    title="Pengalaman Kerja Sebelumnya"
    :columns="columns"
    :rows="rows"
    empty-text="Pengalaman kerja sebelumnya belum ditambahkan."
    @add="openCreate" @view="openView" @edit="openEdit"
  >
    <template #cell-startDate="{ row }">{{ formatDate(row.startDate) }}</template>
    <template #cell-endDate="{ row }">{{ row.endDate ? formatDate(row.endDate) : 'Sekarang' }}</template>
  </RecordTable>

  <DetailModal :open="mode === 'view'" title="Detail Pengalaman Kerja" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Edit Pengalaman Kerja' : 'Tambah Pengalaman Kerja'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close" @submit="submit"
  >
    <FormField label="Perusahaan / Instansi" for-id="wh-emp" required :error="errors.employerName">
      <input id="wh-emp" v-model="form.employerName" class="input" placeholder="Masukkan nama perusahaan" :aria-invalid="!!errors.employerName" />
    </FormField>
    <FormField label="Jabatan" for-id="wh-pos" required :error="errors.positionName">
      <input id="wh-pos" v-model="form.positionName" class="input" placeholder="Masukkan jabatan" :aria-invalid="!!errors.positionName" />
    </FormField>
    <FormField label="Tanggal Mulai" for-id="wh-start" required :error="errors.startDate">
      <input id="wh-start" v-model="form.startDate" type="date" class="input" :aria-invalid="!!errors.startDate" />
    </FormField>
    <FormField label="Tanggal Selesai" for-id="wh-end" :error="errors.endDate" hint="Kosongkan jika masih bekerja di sana.">
      <input id="wh-end" v-model="form.endDate" type="date" class="input" :aria-invalid="!!errors.endDate" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Deskripsi (opsional)" for-id="wh-desc">
        <textarea id="wh-desc" v-model="form.description" rows="3" class="input" />
      </FormField>
    </div>
  </FormModal>
</template>
