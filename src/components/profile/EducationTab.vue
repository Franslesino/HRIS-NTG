<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import RecordTable from '@/components/ui/RecordTable.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import FormModal from '@/components/ui/FormModal.vue'
import FormField from '@/components/ui/FormField.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { api } from '@/api'
import { useApiErrors } from '@/composables/useApiErrors'
import { useRecordModal } from '@/composables/useRecordModal'
import { useReferences } from '@/composables/useReferences'
import { useToast } from '@/composables/useToast'
import { yearOptions } from '@/data/options'
import { isBlank } from '@/utils/validators'
import type { Education, EducationInput, EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const emit = defineEmits<{ refresh: [] }>()
const { show } = useToast()
const { apply } = useApiErrors()
const { refs } = useReferences()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<Education>()
const years = yearOptions()

const columns = [
  { key: 'educationLevelName', label: 'Jenjang', width: '1fr' },
  { key: 'institutionName', label: 'Institusi', width: '1.5fr' },
  { key: 'fieldOfStudy', label: 'Jurusan', width: '1.4fr' },
  { key: 'graduationYear', label: 'Tahun Lulus', width: '95px' },
  { key: 'isHighest', label: 'Tertinggi', width: '90px' },
]
const rows = computed(() => props.employee.educations)

const blank = (): EducationInput => ({ educationLevelId: '', institutionName: '', fieldOfStudy: '', graduationYear: '', isHighest: false })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const saving = ref(false)

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r
      ? { educationLevelId: r.educationLevelId, institutionName: r.institutionName, fieldOfStudy: r.fieldOfStudy, graduationYear: r.graduationYear ? String(r.graduationYear) : '', isHighest: r.isHighest }
      : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (!form.educationLevelId) e.educationLevelId = 'Jenjang pendidikan wajib dipilih.'
  if (isBlank(form.institutionName)) e.institutionName = 'Nama institusi wajib diisi.'
  if (isBlank(form.fieldOfStudy)) e.fieldOfStudy = 'Jurusan wajib diisi.'
  if (!form.graduationYear) e.graduationYear = 'Tahun lulus wajib dipilih.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  if (saving.value || !validate()) return
  saving.value = true
  try {
    await api.saveEducation(props.employee.id, { ...form }, record.value?.id)
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
        { label: 'Jenjang', value: r.educationLevelName },
        { label: 'Institusi', value: r.institutionName },
        { label: 'Jurusan', value: r.fieldOfStudy },
        { label: 'Tahun Lulus', value: r.graduationYear ? String(r.graduationYear) : '-' },
        { label: 'Pendidikan Tertinggi', value: r.isHighest ? 'Ya' : 'Tidak' },
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
    <template #cell-educationLevelName="{ row }"><span class="font-semibold">{{ row.educationLevelName }}</span></template>
    <template #cell-isHighest="{ row }">
      <span
        class="inline-block rounded border px-2 py-0.5 text-xs"
        :class="row.isHighest ? 'border-brand-100 bg-brand-50 text-brand-700' : 'border-line bg-surface text-ink-soft'"
      >
        {{ row.isHighest ? 'Ya' : 'Tidak' }}
      </span>
    </template>
  </RecordTable>

  <DetailModal :open="mode === 'view'" title="Detail Riwayat Pendidikan" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Edit Riwayat Pendidikan' : 'Tambah Riwayat Pendidikan'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close" @submit="submit"
  >
    <FormField label="Jenjang Pendidikan" for-id="ed-level" required select :error="errors.educationLevelId">
      <select id="ed-level" v-model="form.educationLevelId" class="select" :aria-invalid="!!errors.educationLevelId">
        <option value="" disabled>Pilih jenjang</option>
        <option v-for="l in refs?.educationLevels ?? []" :key="l.id" :value="l.id">{{ l.name }}</option>
      </select>
    </FormField>
    <FormField label="Nama Institusi / Universitas" for-id="ed-inst" required :error="errors.institutionName">
      <input id="ed-inst" v-model="form.institutionName" class="input" placeholder="Masukkan nama institusi" :aria-invalid="!!errors.institutionName" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField
        label="Jurusan / Program Studi" for-id="ed-major" required :error="errors.fieldOfStudy"
        hint="Tulis lengkap tanpa menggunakan singkatan seperti Teknik menjadi Tek"
      >
        <input id="ed-major" v-model="form.fieldOfStudy" class="input" placeholder="Masukkan jurusan" :aria-invalid="!!errors.fieldOfStudy" />
      </FormField>
    </div>
    <FormField label="Tahun Lulus" for-id="ed-end" required select :error="errors.graduationYear">
      <select id="ed-end" v-model="form.graduationYear" class="select" :aria-invalid="!!errors.graduationYear">
        <option value="" disabled>Pilih tahun lulus</option>
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </FormField>
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-sm font-semibold">Pendidikan Tertinggi</p>
        <p class="text-xs text-ink-soft">Hanya satu yang bisa menjadi tertinggi.</p>
      </div>
      <ToggleSwitch v-model="form.isHighest" label="Pendidikan tertinggi" />
    </div>
  </FormModal>
</template>
