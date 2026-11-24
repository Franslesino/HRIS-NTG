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
import { GENDER_LABEL, RELATIONSHIP_LABEL, entries, label } from '@/data/options'
import { formatDate, orDash } from '@/utils/format'
import { isBlank, isPhone } from '@/utils/validators'
import type { EmployeeDetail, FamilyInput, FamilyMember } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const emit = defineEmits<{ refresh: [] }>()
const { show } = useToast()
const { apply } = useApiErrors()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<FamilyMember>()

const relationshipOptions = entries(RELATIONSHIP_LABEL)
const genderOptions = entries(GENDER_LABEL)

const columns = [
  { key: 'relationshipType', label: 'Hubungan', width: '1fr' },
  { key: 'fullName', label: 'Nama', width: '1.4fr' },
  { key: 'gender', label: 'Jenis Kelamin', width: '1fr' },
  { key: 'birthDate', label: 'Tanggal Lahir', width: '110px' },
  { key: 'phoneNumber', label: 'No. HP', width: '1.2fr' },
  { key: 'isDependent', label: 'Tanggungan', width: '100px' },
]
const rows = computed(() => props.employee.family)

type FamilyFormState = Omit<FamilyInput, 'isDependent'> & { dependent: '' | 'yes' | 'no' }
const blank = (): FamilyFormState => ({ relationshipType: '', gender: '', fullName: '', birthDate: '', phoneNumber: '', dependent: '' })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const saving = ref(false)

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r
      ? { relationshipType: r.relationshipType, gender: r.gender, fullName: r.fullName, birthDate: r.birthDate, phoneNumber: r.phoneNumber, dependent: r.isDependent ? 'yes' : 'no' }
      : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (!form.relationshipType) e.relationshipType = 'Hubungan wajib dipilih.'
  if (isBlank(form.fullName)) e.fullName = 'Nama wajib diisi.'
  if (!form.gender) e.gender = 'Jenis kelamin wajib dipilih.'
  if (!form.birthDate) e.birthDate = 'Tanggal lahir wajib diisi.'
  if (form.phoneNumber && !isPhone(form.phoneNumber)) e.phoneNumber = 'Nomor HP harus berupa angka, 10-15 digit.'
  if (!form.dependent) e.dependent = 'Status tanggungan wajib dipilih.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  if (saving.value || !validate()) return
  saving.value = true
  try {
    const { dependent, ...rest } = form
    await api.saveFamily(props.employee.id, { ...rest, isDependent: dependent === 'yes' }, record.value?.id)
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
        { label: 'Hubungan', value: label(RELATIONSHIP_LABEL, r.relationshipType) },
        { label: 'Nama', value: r.fullName },
        { label: 'Jenis Kelamin', value: label(GENDER_LABEL, r.gender) },
        { label: 'Tanggal Lahir', value: formatDate(r.birthDate) },
        { label: 'Nomor HP', value: orDash(r.phoneNumber) },
        { label: 'Status (Tanggungan)', value: r.isDependent ? 'Ya' : 'Tidak' },
      ]
    : []
})
const isForm = computed(() => mode.value === 'create' || mode.value === 'edit')
</script>

<template>
  <RecordTable
    title="Data Anggota Keluarga"
    :columns="columns"
    :rows="rows"
    empty-text="Data anggota keluarga pegawai belum ditambahkan."
    @add="openCreate" @view="openView" @edit="openEdit"
  >
    <template #cell-relationshipType="{ row }"><span class="font-semibold">{{ label(RELATIONSHIP_LABEL, row.relationshipType) }}</span></template>
    <template #cell-gender="{ row }">{{ label(GENDER_LABEL, row.gender) }}</template>
    <template #cell-birthDate="{ row }">{{ formatDate(row.birthDate) }}</template>
    <template #cell-isDependent="{ row }">
      <span
        class="inline-block rounded border px-2 py-0.5 text-xs"
        :class="row.isDependent ? 'border-brand-100 bg-brand-50 text-brand-700' : 'border-line bg-surface text-ink-soft'"
      >
        {{ row.isDependent ? 'Ya' : 'Tidak' }}
      </span>
    </template>
  </RecordTable>

  <DetailModal :open="mode === 'view'" title="Detail Data Keluarga" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Edit Data Keluarga' : 'Tambah Data Keluarga'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close" @submit="submit"
  >
    <FormField label="Hubungan" for-id="fm-rel" required select :error="errors.relationshipType">
      <select id="fm-rel" v-model="form.relationshipType" class="select" :aria-invalid="!!errors.relationshipType">
        <option value="" disabled>Pilih hubungan</option>
        <option v-for="r in relationshipOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
      </select>
    </FormField>
    <FormField label="Nama" for-id="fm-name" required :error="errors.fullName">
      <input id="fm-name" v-model="form.fullName" class="input" placeholder="Masukkan nama lengkap" :aria-invalid="!!errors.fullName" />
    </FormField>
    <FormField label="Jenis Kelamin" for-id="fm-gender" required select :error="errors.gender">
      <select id="fm-gender" v-model="form.gender" class="select" :aria-invalid="!!errors.gender">
        <option value="" disabled>Pilih jenis kelamin</option>
        <option v-for="g in genderOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
      </select>
    </FormField>
    <FormField label="Tanggal Lahir" for-id="fm-birth" required :error="errors.birthDate">
      <input id="fm-birth" v-model="form.birthDate" type="date" class="input" :aria-invalid="!!errors.birthDate" />
    </FormField>
    <FormField label="Nomor HP (opsional)" for-id="fm-phone" :error="errors.phoneNumber">
      <input id="fm-phone" v-model="form.phoneNumber" type="tel" class="input" :aria-invalid="!!errors.phoneNumber" />
    </FormField>
    <FormField label="Status" for-id="fm-status" required select :error="errors.dependent">
      <select id="fm-status" v-model="form.dependent" class="select" :aria-invalid="!!errors.dependent">
        <option value="" disabled>Pilih status</option>
        <option value="yes">Tanggungan</option>
        <option value="no">Bukan Tanggungan</option>
      </select>
    </FormField>
  </FormModal>
</template>
