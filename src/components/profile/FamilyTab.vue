<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import RecordTable from '@/components/ui/RecordTable.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import FormModal from '@/components/ui/FormModal.vue'
import FormField from '@/components/ui/FormField.vue'
import { useRecordModal } from '@/composables/useRecordModal'
import { useToast } from '@/composables/useToast'
import { employeeStore } from '@/stores/employeeStore'
import { RELATIONS } from '@/data/options'
import { formatDate } from '@/utils/format'
import { isBlank, isNik } from '@/utils/validators'
import { uid } from '@/utils/id'
import type { EmployeeDetail, FamilyMember } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const { show } = useToast()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<FamilyMember>()

const columns = [
  { key: 'relation', label: 'Hubungan', width: '1fr' },
  { key: 'name', label: 'Nama', width: '1.4fr' },
  { key: 'nik', label: 'NIK', width: '1.4fr' },
  { key: 'birthDate', label: 'Tanggal Lahir', width: '110px' },
  { key: 'occupation', label: 'Pekerjaan', width: '1.2fr' },
  { key: 'dependent', label: 'Tanggungan', width: '100px' },
]
const rows = computed(() => props.employee.family)

const blank = () => ({ relation: '', name: '', nik: '', birthDate: '', occupation: '', status: '' })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r
      ? { relation: r.relation, name: r.name, nik: r.nik, birthDate: r.birthDate, occupation: r.occupation, status: r.dependent ? 'Tanggungan' : 'Bukan Tanggungan' }
      : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (!form.relation) e.relation = 'Hubungan wajib dipilih.'
  if (isBlank(form.name)) e.name = 'Nama wajib diisi.'
  if (!isNik(form.nik)) e.nik = 'NIK harus terdiri dari 16 digit angka.'
  if (!form.birthDate) e.birthDate = 'Tanggal lahir wajib diisi.'
  if (isBlank(form.occupation)) e.occupation = 'Pekerjaan wajib diisi.'
  if (!form.status) e.status = 'Status wajib dipilih.'
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) return
  employeeStore.saveRecord(props.employee.id, 'family', {
    id: record.value?.id ?? uid(),
    relation: form.relation, name: form.name.trim(), nik: form.nik.trim(),
    birthDate: form.birthDate, occupation: form.occupation.trim(),
    dependent: form.status === 'Tanggungan',
  })
  show(mode.value === 'create' ? 'Data pegawai berhasil disimpan' : 'Data pegawai berhasil diperbarui')
  close()
}

const detail = computed(() => {
  const r = record.value
  return r
    ? [
        { label: 'Hubungan', value: r.relation },
        { label: 'Nama', value: r.name },
        { label: 'NIK', value: r.nik },
        { label: 'Tanggal Lahir', value: formatDate(r.birthDate) },
        { label: 'Pekerjaan', value: r.occupation },
        { label: 'Status (Tanggungan)', value: r.dependent ? 'Ya' : 'Tidak' },
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
  </RecordTable>

  <DetailModal :open="mode === 'view'" title="Detail Data Keluarga" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Edit Data Keluarga' : 'Tambah Data Keluarga'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close" @submit="submit"
  >
    <FormField label="Hubungan" for-id="fm-rel" required select :error="errors.relation">
      <select id="fm-rel" v-model="form.relation" class="select" :aria-invalid="!!errors.relation">
        <option value="" disabled>Pilih hubungan</option>
        <option v-for="r in RELATIONS" :key="r" :value="r">{{ r }}</option>
      </select>
    </FormField>
    <FormField label="Nama" for-id="fm-name" required :error="errors.name">
      <input id="fm-name" v-model="form.name" class="input" placeholder="Masukkan nama lengkap" :aria-invalid="!!errors.name" />
    </FormField>
    <FormField label="NIK" for-id="fm-nik" required :error="errors.nik">
      <input id="fm-nik" v-model="form.nik" class="input" inputmode="numeric" maxlength="16" placeholder="Masukkan 16 digit NIK" :aria-invalid="!!errors.nik" />
    </FormField>
    <FormField label="Tanggal Lahir" for-id="fm-birth" required :error="errors.birthDate">
      <input id="fm-birth" v-model="form.birthDate" type="date" class="input" :aria-invalid="!!errors.birthDate" />
    </FormField>
    <FormField label="Pekerjaan" for-id="fm-job" required :error="errors.occupation">
      <input id="fm-job" v-model="form.occupation" class="input" placeholder="Masukkan pekerjaan" :aria-invalid="!!errors.occupation" />
    </FormField>
    <FormField label="Status" for-id="fm-status" required select :error="errors.status">
      <select id="fm-status" v-model="form.status" class="select" :aria-invalid="!!errors.status">
        <option value="" disabled>Pilih status</option>
        <option>Tanggungan</option>
        <option>Bukan Tanggungan</option>
      </select>
    </FormField>
  </FormModal>
</template>
