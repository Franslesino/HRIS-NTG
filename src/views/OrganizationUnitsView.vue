<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import OrgNav from '@/components/org/OrgNav.vue'
import UnitTreeNode from '@/components/org/UnitTreeNode.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import FormModal from '@/components/ui/FormModal.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { api, errorMessage } from '@/api'
import { useApiErrors } from '@/composables/useApiErrors'
import { reloadReferences } from '@/composables/useReferences'
import { useToast } from '@/composables/useToast'
import { unitPath } from '@/utils/employee'
import { buildUnitTree, descendantIds } from '@/utils/organization'
import { isBlank } from '@/utils/validators'
import type { OrgReferences, OrgUnit, OrgUnitInput, Position } from '@/types/organization'

const { show } = useToast()
const { apply } = useApiErrors()

const units = ref<OrgUnit[]>([])
const positions = ref<Position[]>([])
const orgRefs = ref<OrgReferences | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const selectedId = ref<string | null>(null)

const tree = computed(() => buildUnitTree(units.value))
const selected = computed(() => units.value.find((u) => u.id === selectedId.value) ?? null)
const selectedPositions = computed(() =>
  positions.value.filter((p) => p.organizationUnitId === selectedId.value).sort((a, b) => a.name.localeCompare(b.name, 'id')),
)

async function load() {
  try {
    const [u, p, o] = await Promise.all([api.listUnits(), api.listPositions(), api.getOrgReferences()])
    units.value = u
    positions.value = p
    orgRefs.value = o
    loadError.value = null
    if (!selectedId.value || !u.some((x) => x.id === selectedId.value)) selectedId.value = buildUnitTree(u)[0]?.id ?? null
  } catch (err) {
    loadError.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
onMounted(load)

/* ---------- form tambah / ubah ---------- */
const mode = ref<'create' | 'edit' | null>(null)
const blank = (): OrgUnitInput => ({ parentUnitId: '', unitTypeId: '', code: '', name: '', description: '', isActive: true })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const saving = ref(false)

function openCreate(parentId = '') {
  Object.assign(form, blank(), { parentUnitId: parentId })
  errors.value = {}
  mode.value = 'create'
}
function openEdit() {
  const u = selected.value
  if (!u) return
  Object.assign(form, { parentUnitId: u.parentUnitId ?? '', unitTypeId: u.unitTypeId, code: u.code, name: u.name, description: u.description, isActive: u.isActive })
  errors.value = {}
  mode.value = 'edit'
}

// Induk yang boleh dipilih: bukan unit itu sendiri dan bukan turunannya (mencegah siklus)
const parentOptions = computed(() => {
  const blocked = mode.value === 'edit' && selectedId.value ? descendantIds(units.value, selectedId.value) : new Set<string>()
  return units.value
    .filter((u) => !blocked.has(u.id) && (u.isActive || u.id === form.parentUnitId))
    .map((u) => ({ value: u.id, label: unitPath(u.id, units.value) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'id'))
})
const previewPath = computed(() => {
  const parent = form.parentUnitId ? unitPath(form.parentUnitId, units.value) : ''
  const name = form.name.trim() || '(nama unit)'
  return parent ? `${parent} / ${name}` : name
})

watch(form, () => { if (Object.keys(errors.value).length) errors.value = validate() }, { deep: true })

function validate() {
  const e: Record<string, string> = {}
  if (isBlank(form.name)) e.name = 'Nama unit wajib diisi.'
  if (isBlank(form.code)) e.code = 'Kode unit wajib diisi.'
  if (!form.unitTypeId) e.unitTypeId = 'Jenis unit wajib dipilih.'
  return e
}

async function submit() {
  if (saving.value) return
  errors.value = validate()
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    const editingId = mode.value === 'edit' ? selectedId.value ?? undefined : undefined
    await api.saveUnit({ ...form }, editingId)
    show(editingId ? 'Data unit berhasil diperbarui' : 'Unit berhasil ditambahkan')
    mode.value = null
    await load()
    void reloadReferences()
  } catch (err) {
    apply(err, errors)
  } finally {
    saving.value = false
  }
}

/* ---------- hapus (soft delete) ---------- */
const deleting = ref(false)
const busy = ref(false)
async function confirmDelete() {
  if (!selected.value || busy.value) return
  busy.value = true
  try {
    const parentId = selected.value.parentUnitId
    await api.deleteUnit(selected.value.id)
    show('Unit berhasil dihapus')
    selectedId.value = parentId
    deleting.value = false
    await load()
    void reloadReferences()
  } catch (err) {
    deleting.value = false
    apply(err)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppHeader title="Organisasi & Jabatan" :breadcrumb="[{ label: 'Organisasi & Jabatan' }, { label: 'Struktur Unit' }]" />
  <div class="mt-6"><OrgNav /></div>

  <div v-if="loading" class="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]" aria-busy="true" aria-label="Memuat struktur organisasi">
    <div class="h-[420px] animate-pulse rounded-xl border border-line bg-white" />
    <div class="h-[420px] animate-pulse rounded-xl border border-line bg-white" />
  </div>

  <p v-else-if="loadError" class="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{{ loadError }}</p>

  <div v-else class="mt-5 grid items-start gap-5 lg:grid-cols-[360px_1fr]">
    <!-- Pohon -->
    <section class="rounded-xl border border-line bg-white p-4">
      <div class="flex items-center justify-between gap-3 border-b border-line pb-3">
        <h2 class="text-sm font-semibold">Struktur Organisasi</h2>
        <button type="button" class="btn btn-primary" @click="openCreate()"><AppIcon name="plus" :size="14" /> Tambah Unit</button>
      </div>
      <p v-if="tree.length === 0" class="py-8 text-center text-sm text-ink-soft">
        Belum ada unit organisasi. Tambahkan unit tingkat atas untuk memulai.
      </p>
      <ul v-else class="mt-3" role="tree" aria-label="Struktur unit organisasi">
        <UnitTreeNode v-for="n in tree" :key="n.id" :node="n" :selected-id="selectedId" @select="selectedId = $event" />
      </ul>
    </section>

    <!-- Detail -->
    <section class="rounded-xl border border-line bg-white p-6">
      <div v-if="!selected" class="py-12 text-center text-sm text-ink-soft">Pilih unit pada pohon untuk melihat detailnya.</div>
      <template v-else>
        <div class="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div class="min-w-0">
            <p class="text-xs text-ink-soft">{{ unitPath(selected.id, units) }}</p>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <h2 class="text-base font-semibold">{{ selected.name }}</h2>
              <StatusBadge :label="selected.isActive ? 'Aktif' : 'Nonaktif'" :tone="selected.isActive ? 'ok' : 'off'" />
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline" @click="openCreate(selected.id)"><AppIcon name="plus" :size="14" /> Tambah Subunit</button>
            <button type="button" class="btn btn-outline" @click="openEdit"><AppIcon name="pencil" :size="14" /> Ubah</button>
            <button type="button" class="btn btn-danger-outline" @click="deleting = true"><AppIcon name="trash" :size="14" /> Hapus</button>
          </div>
        </div>

        <dl class="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div><dt class="text-xs text-ink-soft">Kode</dt><dd class="text-sm">{{ selected.code }}</dd></div>
          <div><dt class="text-xs text-ink-soft">Jenis Unit</dt><dd class="text-sm">{{ selected.unitTypeName }}</dd></div>
          <div>
            <dt class="text-xs text-ink-soft">Unit Induk</dt>
            <dd class="text-sm">{{ selected.parentUnitId ? unitPath(selected.parentUnitId, units) : 'Unit tingkat atas' }}</dd>
          </div>
          <div><dt class="text-xs text-ink-soft">Subunit</dt><dd class="text-sm">{{ selected.childCount }}</dd></div>
          <div class="sm:col-span-2"><dt class="text-xs text-ink-soft">Deskripsi</dt><dd class="text-sm">{{ selected.description || '-' }}</dd></div>
        </dl>

        <div class="mt-6">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold">Jabatan di unit ini ({{ selectedPositions.length }})</h3>
            <RouterLink to="/organisasi/jabatan" class="text-xs text-brand-600 hover:underline">Kelola jabatan</RouterLink>
          </div>
          <p v-if="selectedPositions.length === 0" class="mt-2 text-sm text-ink-soft">Belum ada jabatan pada unit ini.</p>
          <ul v-else class="mt-2 divide-y divide-line rounded-lg border border-line">
            <li v-for="p in selectedPositions" :key="p.id" class="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span class="min-w-0 truncate" :class="!p.isActive && 'text-ink-soft'">{{ p.name }}</span>
              <span class="shrink-0 text-xs text-ink-soft">{{ p.positionTypeName }} · {{ p.holderCount }} pemegang</span>
            </li>
          </ul>
        </div>
      </template>
    </section>
  </div>

  <FormModal
    :open="mode !== null"
    :title="mode === 'edit' ? 'Ubah Unit Organisasi' : form.parentUnitId ? 'Tambah Subunit' : 'Tambah Unit Organisasi'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="mode = null"
    @submit="submit"
  >
    <FormField label="Nama Unit" for-id="u-name" required :error="errors.name">
      <input id="u-name" v-model="form.name" class="input" :aria-invalid="!!errors.name" />
    </FormField>
    <FormField label="Kode Unit" for-id="u-code" required :error="errors.code">
      <input id="u-code" v-model="form.code" class="input" placeholder="Contoh: TI-APP" :aria-invalid="!!errors.code" />
    </FormField>
    <FormField label="Jenis Unit" for-id="u-type" required select :error="errors.unitTypeId" hint="Jenis hanya klasifikasi; hierarki ditentukan oleh unit induk.">
      <select id="u-type" v-model="form.unitTypeId" class="select" :aria-invalid="!!errors.unitTypeId">
        <option value="" disabled>Pilih jenis unit</option>
        <option v-for="t in orgRefs?.unitTypes ?? []" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
    </FormField>
    <FormField label="Unit Induk" for-id="u-parent" select :error="errors.parentUnitId">
      <select id="u-parent" v-model="form.parentUnitId" class="select" :aria-invalid="!!errors.parentUnitId">
        <option value="">Tidak ada (unit tingkat atas)</option>
        <option v-for="o in parentOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </FormField>
    <div class="rounded-lg border border-line bg-surface px-3 py-2 text-xs sm:col-span-2">
      <span class="text-ink-soft">Posisi di pohon: </span><span class="font-semibold">{{ previewPath }}</span>
    </div>
    <div class="sm:col-span-2">
      <FormField label="Deskripsi (opsional)" for-id="u-desc">
        <textarea id="u-desc" v-model="form.description" rows="2" class="input" />
      </FormField>
    </div>
    <div class="flex items-center justify-between gap-4 sm:col-span-2">
      <div>
        <p class="text-sm font-semibold">Unit Aktif</p>
        <p class="text-xs text-ink-soft">Unit nonaktif tidak muncul sebagai pilihan pada form baru.</p>
      </div>
      <ToggleSwitch v-model="form.isActive" label="Unit aktif" />
    </div>
  </FormModal>

  <ConfirmDialog
    :open="deleting"
    icon="alert-triangle"
    danger
    title="Hapus Unit Organisasi?"
    :message="`Unit “${selected?.name ?? ''}” akan dihapus secara lunak. Unit yang masih memiliki subunit atau jabatan tidak dapat dihapus.`"
    confirm-label="Ya, Hapus"
    @close="deleting = false"
    @confirm="confirmDelete"
  />
</template>
