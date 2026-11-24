<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
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
import { currentAssignment, positionGroups, todayIso } from '@/utils/employee'
import { formatDate, orDash } from '@/utils/format'
import type { Assignment, AssignmentInput, EmployeeDetail, EmployeeOption } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const emit = defineEmits<{ refresh: [] }>()
const { show } = useToast()
const { apply } = useApiErrors()
const { refs } = useReferences()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<Assignment>()

const people = ref<EmployeeOption[]>([])
onMounted(async () => { people.value = await api.listEmployeeOptions() })
const bossOptions = computed(() => people.value.filter((x) => x.id !== props.employee.id))
const groups = computed(() => positionGroups(refs.value))

const columns = [
  { key: 'positionName', label: 'Jabatan', width: '1.6fr' },
  { key: 'unitName', label: 'Unit Kerja', width: '1.4fr' },
  { key: 'officeName', label: 'Kantor', width: '1.2fr' },
  { key: 'validFrom', label: 'Tanggal Mulai', width: '110px' },
  { key: 'validTo', label: 'Tanggal Selesai', width: '120px' },
]
const rows = computed(() => props.employee.assignments)
const currentId = computed(() => currentAssignment(props.employee.assignments)?.id)

const blank = (): AssignmentInput => ({
  positionId: '', officeId: '', reportsToEmployeeId: '', validFrom: todayIso(), validTo: '', isPrimary: true, note: '',
})
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const saving = ref(false)

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r
      ? { positionId: r.positionId, officeId: r.officeId, reportsToEmployeeId: r.reportsToEmployeeId, validFrom: r.validFrom, validTo: r.validTo, isPrimary: r.isPrimary, note: r.note }
      : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (!form.positionId) e.positionId = 'Jabatan wajib dipilih.'
  if (!form.validFrom) e.validFrom = 'Tanggal mulai wajib diisi.'
  if (form.validTo && form.validFrom && form.validTo < form.validFrom) e.validTo = 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  if (saving.value || !validate()) return
  saving.value = true
  try {
    await api.saveAssignment(props.employee.id, { ...form }, record.value?.id)
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
        { label: 'Jabatan', value: r.positionName },
        { label: 'Unit Kerja', value: r.parentUnitName ? `${r.parentUnitName} / ${r.unitName}` : r.unitName },
        { label: 'Kantor', value: orDash(r.officeName) },
        { label: 'Atasan Langsung', value: orDash(r.reportsToName) },
        { label: 'Tanggal Mulai', value: formatDate(r.validFrom) },
        { label: 'Tanggal Selesai', value: r.validTo ? formatDate(r.validTo) : 'Sekarang' },
        { label: 'Penempatan Utama', value: r.isPrimary ? 'Ya' : 'Tidak' },
        { label: 'Catatan', value: orDash(r.note) },
      ]
    : []
})
const isForm = computed(() => mode.value === 'create' || mode.value === 'edit')
</script>

<template>
  <RecordTable
    title="Riwayat Jabatan & Penempatan"
    :columns="columns"
    :rows="rows"
    empty-text="Riwayat jabatan pegawai belum ditambahkan."
    @add="openCreate" @view="openView" @edit="openEdit"
  >
    <template #cell-positionName="{ row }">
      <span class="flex flex-wrap items-center gap-2" :class="row.id === currentId && 'font-semibold'">
        {{ row.positionName }}
        <span v-if="row.id === currentId" class="rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">Saat Ini</span>
      </span>
    </template>
    <template #cell-validFrom="{ row }">{{ formatDate(row.validFrom) }}</template>
    <template #cell-validTo="{ row }">
      <span :class="!row.validTo && 'font-semibold'">{{ row.validTo ? formatDate(row.validTo) : 'Sekarang' }}</span>
    </template>
  </RecordTable>

  <DetailModal :open="mode === 'view'" title="Detail Penempatan" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Edit Penempatan' : 'Tambah Penempatan'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close" @submit="submit"
  >
    <div class="sm:col-span-2">
      <FormField label="Jabatan" for-id="as-pos" required select :error="errors.positionId" hint="Unit kerja mengikuti jabatan yang dipilih.">
        <select id="as-pos" v-model="form.positionId" class="select" :aria-invalid="!!errors.positionId">
          <option value="" disabled>Pilih jabatan</option>
          <optgroup v-for="g in groups" :key="g.label" :label="g.label">
            <option v-for="p in g.items" :key="p.id" :value="p.id">{{ p.name }}</option>
          </optgroup>
        </select>
      </FormField>
    </div>
    <FormField label="Kantor" for-id="as-office" select>
      <select id="as-office" v-model="form.officeId" class="select">
        <option value="">Pilih kantor</option>
        <option v-for="o in refs?.offices ?? []" :key="o.id" :value="o.id">{{ o.name }}</option>
      </select>
    </FormField>
    <FormField label="Atasan Langsung" for-id="as-boss" select>
      <select id="as-boss" v-model="form.reportsToEmployeeId" class="select">
        <option value="">Tidak ada</option>
        <option v-for="b in bossOptions" :key="b.id" :value="b.id">{{ b.fullName }} ({{ b.employeeNumber }})</option>
      </select>
    </FormField>
    <FormField label="Tanggal Mulai" for-id="as-from" required :error="errors.validFrom">
      <input id="as-from" v-model="form.validFrom" type="date" class="input" :aria-invalid="!!errors.validFrom" />
    </FormField>
    <FormField label="Tanggal Selesai" for-id="as-to" :error="errors.validTo" hint="Kosongkan jika masih berlaku.">
      <input id="as-to" v-model="form.validTo" type="date" class="input" :aria-invalid="!!errors.validTo" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Catatan" for-id="as-note">
        <input id="as-note" v-model="form.note" class="input" placeholder="Catatan penempatan (opsional)" />
      </FormField>
    </div>
    <div class="flex items-center justify-between gap-4 sm:col-span-2">
      <div>
        <p class="text-sm font-semibold">Penempatan Utama</p>
        <p class="text-xs text-ink-soft">Penempatan utama yang berlaku dipakai sebagai jabatan pegawai saat ini.</p>
      </div>
      <ToggleSwitch v-model="form.isPrimary" label="Penempatan utama" />
    </div>
  </FormModal>
</template>
