<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import RecordTable from '@/components/ui/RecordTable.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import FormModal from '@/components/ui/FormModal.vue'
import FormField from '@/components/ui/FormField.vue'
import { useRecordModal } from '@/composables/useRecordModal'
import { useToast } from '@/composables/useToast'
import { employeeStore } from '@/stores/employeeStore'
import { EDUCATION_LEVELS, educationLabel, yearOptions } from '@/data/options'
import { isBlank } from '@/utils/validators'
import { uid } from '@/utils/id'
import type { Education, EducationLevel, EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const { show } = useToast()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<Education>()
const years = yearOptions()

const columns = [
  { key: 'level', label: 'Jenjang', width: '70px' },
  { key: 'institution', label: 'Institusi', width: '1.5fr' },
  { key: 'major', label: 'Jurusan', width: '1.4fr' },
  { key: 'startYear', label: 'Tahun Masuk', width: '95px' },
  { key: 'endYear', label: 'Tahun Lulus', width: '95px' },
  { key: 'diplomaNumber', label: 'No. Ijazah', width: '1.4fr' },
]
const rows = computed(() => [...props.employee.educations].sort((a, b) => b.endYear.localeCompare(a.endYear)))

const blank = () => ({ level: '' as EducationLevel | '', institution: '', major: '', startYear: '', endYear: '', diplomaNumber: '' })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r ? { ...r } : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (!form.level) e.level = 'Jenjang pendidikan wajib dipilih.'
  if (isBlank(form.institution)) e.institution = 'Nama institusi wajib diisi.'
  if (isBlank(form.major)) e.major = 'Jurusan wajib diisi.'
  if (!form.startYear) e.startYear = 'Tahun masuk wajib dipilih.'
  if (!form.endYear) e.endYear = 'Tahun lulus wajib dipilih.'
  else if (form.startYear && form.endYear < form.startYear) e.endYear = 'Tahun lulus tidak boleh sebelum tahun masuk.'
  if (isBlank(form.diplomaNumber)) e.diplomaNumber = 'Nomor ijazah wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) return
  employeeStore.saveRecord(props.employee.id, 'educations', {
    id: record.value?.id ?? uid(),
    level: form.level as EducationLevel,
    institution: form.institution.trim(), major: form.major.trim(),
    startYear: form.startYear, endYear: form.endYear, diplomaNumber: form.diplomaNumber.trim(),
  })
  show(mode.value === 'create' ? 'Data pegawai berhasil disimpan' : 'Data pegawai berhasil diperbarui')
  close()
}

const detail = computed(() => {
  const r = record.value
  return r
    ? [
        { label: 'Jenjang', value: educationLabel(r.level) },
        { label: 'Institusi', value: r.institution },
        { label: 'Jurusan', value: r.major },
        { label: 'Tahun Masuk', value: r.startYear },
        { label: 'Tahun Lulus', value: r.endYear },
        { label: 'Nomor Ijazah', value: r.diplomaNumber },
      ]
    : []
})
const isForm = computed(() => mode.value === 'create' || mode.value === 'edit')
</script>

<template>
  <RecordTable
    title="Data Riwayat Pendidikan Formal"
    :columns="columns"
    :rows="rows"
    empty-text="Riwayat pendidikan pegawai belum ditambahkan."
    @add="openCreate" @view="openView" @edit="openEdit"
  >
    <template #cell-level="{ row }"><span class="font-semibold">{{ row.level }}</span></template>
  </RecordTable>

  <DetailModal :open="mode === 'view'" title="Detail Riwayat Pendidikan" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Edit Riwayat Pendidikan' : 'Tambah Riwayat Pendidikan'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close" @submit="submit"
  >
    <FormField label="Jenjang Pendidikan" for-id="ed-level" required select :error="errors.level">
      <select id="ed-level" v-model="form.level" class="select" :aria-invalid="!!errors.level">
        <option value="" disabled>Pilih jenjang</option>
        <option v-for="l in EDUCATION_LEVELS" :key="l.value" :value="l.value">{{ l.label }}</option>
      </select>
    </FormField>
    <FormField label="Nama Institusi / Universitas" for-id="ed-inst" required :error="errors.institution">
      <input id="ed-inst" v-model="form.institution" class="input" placeholder="Masukkan nama institusi" :aria-invalid="!!errors.institution" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField
        label="Jurusan / Program Studi" for-id="ed-major" required :error="errors.major"
        hint="Tulis lengkap tanpa menggunakan singkatan seperti Teknik menjadi Tek"
      >
        <input id="ed-major" v-model="form.major" class="input" placeholder="Masukkan jurusan" :aria-invalid="!!errors.major" />
      </FormField>
    </div>
    <FormField label="Tahun Masuk" for-id="ed-start" required select :error="errors.startYear">
      <select id="ed-start" v-model="form.startYear" class="select" :aria-invalid="!!errors.startYear">
        <option value="" disabled>Pilih tahun masuk</option>
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </FormField>
    <FormField label="Tahun Lulus" for-id="ed-end" required select :error="errors.endYear">
      <select id="ed-end" v-model="form.endYear" class="select" :aria-invalid="!!errors.endYear">
        <option value="" disabled>Pilih tahun lulus</option>
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Nomor Ijazah Resmi" for-id="ed-dip" required :error="errors.diplomaNumber">
        <input id="ed-dip" v-model="form.diplomaNumber" class="input" placeholder="Masukkan nomor ijazah" :aria-invalid="!!errors.diplomaNumber" />
      </FormField>
    </div>
  </FormModal>
</template>
