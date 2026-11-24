<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import OrgNav from '@/components/org/OrgNav.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import FormField from '@/components/ui/FormField.vue'
import FormModal from '@/components/ui/FormModal.vue'
import RecordTable from '@/components/ui/RecordTable.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { api, errorMessage } from '@/api'
import { useApiErrors } from '@/composables/useApiErrors'
import { useRecordModal } from '@/composables/useRecordModal'
import { reloadReferences } from '@/composables/useReferences'
import { useToast } from '@/composables/useToast'
import { unitPath } from '@/utils/employee'
import { descendantIds } from '@/utils/organization'
import { formatDate } from '@/utils/format'
import { isBlank } from '@/utils/validators'
import type { OrgReferences, OrgUnit, Position, PositionHolder, PositionInput } from '@/types/organization'

const { show } = useToast()
const { apply } = useApiErrors()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<Position>()

const positions = ref<Position[]>([])
const units = ref<OrgUnit[]>([])
const orgRefs = ref<OrgReferences | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

async function load() {
  try {
    const [p, u, o] = await Promise.all([api.listPositions(), api.listUnits(), api.getOrgReferences()])
    positions.value = p; units.value = u; orgRefs.value = o; loadError.value = null
  } catch (err) {
    loadError.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
onMounted(load)

/* ---------- filter ---------- */
const search = ref('')
const unitFilter = ref('')
const typeFilter = ref('')
const statusFilter = ref<'' | 'active' | 'inactive'>('')
const unitFilterOptions = computed(() =>
  units.value.map((u) => ({ value: u.id, label: unitPath(u.id, units.value) })).sort((a, b) => a.label.localeCompare(b.label, 'id')),
)
const filtered = computed(() => {
  const kw = search.value.trim().toLowerCase()
  const unitIds = unitFilter.value ? descendantIds(units.value, unitFilter.value) : null
  return positions.value
    .filter((p) =>
      (!kw || p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw)) &&
      (!unitIds || unitIds.has(p.organizationUnitId)) &&
      (!typeFilter.value || p.positionTypeId === typeFilter.value) &&
      (!statusFilter.value || p.isActive === (statusFilter.value === 'active')),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))
})
const isFiltering = computed(() => !!(search.value || unitFilter.value || typeFilter.value || statusFilter.value))
function resetFilters() { search.value = ''; unitFilter.value = ''; typeFilter.value = ''; statusFilter.value = '' }

const columns = [
  { key: 'code', label: 'Kode', width: '100px' },
  { key: 'name', label: 'Jabatan', width: '1.6fr' },
  { key: 'unitName', label: 'Unit', width: '1.3fr' },
  { key: 'positionTypeName', label: 'Jenis', width: '1fr' },
  { key: 'holderCount', label: 'Pemegang', width: '90px' },
  { key: 'isActive', label: 'Status', width: '90px' },
]

/* ---------- form ---------- */
const blank = (): PositionInput => ({
  organizationUnitId: '', code: '', name: '', positionTypeId: '', parentPositionId: '', echelonId: '',
  allowsMultipleHolders: true, levelLabel: '', description: '', isActive: true,
})
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const isForm = computed(() => mode.value === 'create' || mode.value === 'edit')

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r
      ? {
          organizationUnitId: r.organizationUnitId, code: r.code, name: r.name, positionTypeId: r.positionTypeId,
          parentPositionId: r.parentPositionId, echelonId: r.echelonId, allowsMultipleHolders: r.allowsMultipleHolders,
          levelLabel: r.levelLabel, description: r.description, isActive: r.isActive,
        }
      : blank())
  }
  if (m === 'view' && record.value) loadHolders(record.value.id)
})
watch(form, () => { if (Object.keys(errors.value).length) errors.value = validate() }, { deep: true })

const unitOptions = computed(() =>
  units.value
    .filter((u) => u.isActive || u.id === form.organizationUnitId)
    .map((u) => ({ value: u.id, label: unitPath(u.id, units.value) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'id')),
)
const parentOptions = computed(() =>
  positions.value.filter((p) => p.id !== record.value?.id).sort((a, b) => a.name.localeCompare(b.name, 'id')),
)

function validate() {
  const e: Record<string, string> = {}
  if (isBlank(form.name)) e.name = 'Nama jabatan wajib diisi.'
  if (isBlank(form.code)) e.code = 'Kode jabatan wajib diisi.'
  if (!form.organizationUnitId) e.organizationUnitId = 'Unit organisasi wajib dipilih.'
  if (!form.positionTypeId) e.positionTypeId = 'Jenis jabatan wajib dipilih.'
  return e
}

async function submit() {
  if (saving.value) return
  errors.value = validate()
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    await api.savePosition({ ...form }, record.value?.id)
    show(mode.value === 'create' ? 'Jabatan berhasil ditambahkan' : 'Data jabatan berhasil diperbarui')
    close()
    await load()
    void reloadReferences()
  } catch (err) {
    apply(err, errors)
  } finally {
    saving.value = false
  }
}

/* ---------- detail + pemegang ---------- */
const holders = ref<PositionHolder[] | null>(null)
async function loadHolders(id: string) {
  holders.value = null
  try { holders.value = await api.listPositionHolders(id) } catch { holders.value = [] }
}
const detail = computed(() => {
  const r = record.value
  if (!r) return []
  const holderText = holders.value === null
    ? 'Memuat...'
    : holders.value.length === 0
      ? 'Belum ada pemegang'
      : holders.value.map((h) => `${h.fullName} (${h.employeeNumber}) sejak ${formatDate(h.validFrom)}`).join('; ')
  return [
    { label: 'Kode', value: r.code },
    { label: 'Nama Jabatan', value: r.name },
    { label: 'Unit Organisasi', value: unitPath(r.organizationUnitId, units.value) },
    { label: 'Jenis Jabatan', value: r.positionTypeName },
    { label: 'Jabatan Atasan', value: r.parentPositionName || '-' },
    { label: 'Eselon', value: r.echelonName || '-' },
    { label: 'Label Level', value: r.levelLabel || '-' },
    { label: 'Banyak Pemegang', value: r.allowsMultipleHolders ? 'Diizinkan' : 'Satu pemegang' },
    { label: 'Status', value: r.isActive ? 'Aktif' : 'Nonaktif' },
    { label: 'Pemegang Saat Ini', value: holderText },
    { label: 'Deskripsi', value: r.description || '-' },
  ]
})

/* ---------- hapus ---------- */
const toDelete = ref<Position | null>(null)
const busy = ref(false)
async function confirmDelete() {
  if (!toDelete.value || busy.value) return
  busy.value = true
  try {
    await api.deletePosition(toDelete.value.id)
    show('Jabatan berhasil dihapus')
    toDelete.value = null
    await load()
    void reloadReferences()
  } catch (err) {
    toDelete.value = null
    apply(err)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppHeader title="Organisasi & Jabatan" :breadcrumb="[{ label: 'Organisasi & Jabatan', to: '/organisasi' }, { label: 'Master Jabatan' }]" />
  <div class="mt-6"><OrgNav /></div>

  <div v-if="loading" class="mt-5 h-[420px] animate-pulse rounded-xl border border-line bg-white" aria-busy="true" aria-label="Memuat jabatan" />
  <p v-else-if="loadError" class="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{{ loadError }}</p>

  <template v-else>
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <div class="relative min-w-[240px] flex-1">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"><AppIcon name="search" :size="16" /></span>
        <input v-model="search" class="input pl-9" placeholder="Cari nama atau kode jabatan..." aria-label="Cari jabatan" />
      </div>
      <select v-model="unitFilter" class="select w-auto max-w-[260px]" aria-label="Filter unit">
        <option value="">Unit: Semua</option>
        <option v-for="o in unitFilterOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="typeFilter" class="select w-auto" aria-label="Filter jenis jabatan">
        <option value="">Jenis: Semua</option>
        <option v-for="t in orgRefs?.positionTypes ?? []" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <select v-model="statusFilter" class="select w-auto" aria-label="Filter status">
        <option value="">Status: Semua</option>
        <option value="active">Aktif</option>
        <option value="inactive">Nonaktif</option>
      </select>
      <button v-if="isFiltering" type="button" class="btn btn-outline" @click="resetFilters">Hapus filter</button>
    </div>

    <div class="mt-4">
      <RecordTable
        title="Daftar Jabatan"
        :columns="columns"
        :rows="filtered"
        :page-size="8"
        deletable
        :empty-text="isFiltering ? 'Data tidak ditemukan. Coba ubah kata kunci atau hapus filter.' : 'Belum ada data jabatan. Tambahkan jabatan untuk mulai menempatkan pegawai.'"
        @add="openCreate" @view="openView" @edit="openEdit" @delete="toDelete = $event"
      >
        <template #cell-name="{ row }"><span class="block truncate font-semibold">{{ row.name }}</span></template>
        <template #cell-isActive="{ row }">
          <StatusBadge :label="row.isActive ? 'Aktif' : 'Nonaktif'" :tone="row.isActive ? 'ok' : 'off'" />
        </template>
      </RecordTable>
    </div>
  </template>

  <DetailModal :open="mode === 'view'" title="Detail Jabatan" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Ubah Jabatan' : 'Tambah Jabatan'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close"
    @submit="submit"
  >
    <FormField label="Nama Jabatan" for-id="p-name" required :error="errors.name">
      <input id="p-name" v-model="form.name" class="input" :aria-invalid="!!errors.name" />
    </FormField>
    <FormField label="Kode Jabatan" for-id="p-code" required :error="errors.code">
      <input id="p-code" v-model="form.code" class="input" placeholder="Contoh: POS-030" :aria-invalid="!!errors.code" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Unit Organisasi" for-id="p-unit" required select :error="errors.organizationUnitId">
        <select id="p-unit" v-model="form.organizationUnitId" class="select" :aria-invalid="!!errors.organizationUnitId">
          <option value="" disabled>Pilih unit organisasi</option>
          <option v-for="o in unitOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </FormField>
    </div>
    <FormField label="Jenis Jabatan" for-id="p-type" required select :error="errors.positionTypeId">
      <select id="p-type" v-model="form.positionTypeId" class="select" :aria-invalid="!!errors.positionTypeId">
        <option value="" disabled>Pilih jenis jabatan</option>
        <option v-for="t in orgRefs?.positionTypes ?? []" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
    </FormField>
    <FormField label="Jabatan Atasan (opsional)" for-id="p-parent" select :error="errors.parentPositionId">
      <select id="p-parent" v-model="form.parentPositionId" class="select" :aria-invalid="!!errors.parentPositionId">
        <option value="">Tidak ada</option>
        <option v-for="p in parentOptions" :key="p.id" :value="p.id">{{ p.name }} ({{ p.unitName }})</option>
      </select>
    </FormField>
    <FormField label="Eselon (khusus ASN, opsional)" for-id="p-ech" select>
      <select id="p-ech" v-model="form.echelonId" class="select">
        <option value="">Tidak ada</option>
        <option v-for="e in orgRefs?.echelons ?? []" :key="e.id" :value="e.id">{{ e.name }}</option>
      </select>
    </FormField>
    <FormField label="Label Level (opsional)" for-id="p-level">
      <input id="p-level" v-model="form.levelLabel" class="input" placeholder="Contoh: Junior, Senior" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Deskripsi (opsional)" for-id="p-desc">
        <textarea id="p-desc" v-model="form.description" rows="2" class="input" />
      </FormField>
    </div>
    <div class="flex items-center justify-between gap-4 sm:col-span-2">
      <div>
        <p class="text-sm font-semibold">Boleh Dipegang Banyak Pegawai</p>
        <p class="text-xs text-ink-soft" :class="errors.allowsMultipleHolders && 'text-red-600'">
          {{ errors.allowsMultipleHolders || 'Matikan jika jabatan hanya boleh dipegang satu pegawai pada satu waktu.' }}
        </p>
      </div>
      <ToggleSwitch v-model="form.allowsMultipleHolders" label="Boleh banyak pemegang" />
    </div>
    <div class="flex items-center justify-between gap-4 sm:col-span-2">
      <div>
        <p class="text-sm font-semibold">Jabatan Aktif</p>
        <p class="text-xs text-ink-soft">Jabatan nonaktif tidak muncul sebagai pilihan penempatan baru.</p>
      </div>
      <ToggleSwitch v-model="form.isActive" label="Jabatan aktif" />
    </div>
  </FormModal>

  <ConfirmDialog
    :open="toDelete !== null"
    icon="alert-triangle"
    danger
    title="Hapus Jabatan?"
    :message="`Jabatan “${toDelete?.name ?? ''}” akan dihapus secara lunak. Jabatan yang pernah dipakai pada penempatan pegawai tidak dapat dihapus; nonaktifkan saja.`"
    confirm-label="Ya, Hapus"
    @close="toDelete = null"
    @confirm="confirmDelete"
  />
</template>
