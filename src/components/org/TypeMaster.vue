<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import FormField from '@/components/ui/FormField.vue'
import FormModal from '@/components/ui/FormModal.vue'
import RecordTable from '@/components/ui/RecordTable.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { api, errorMessage } from '@/api'
import { useApiErrors } from '@/composables/useApiErrors'
import { useRecordModal } from '@/composables/useRecordModal'
import { useToast } from '@/composables/useToast'
import { isBlank } from '@/utils/validators'
import type { TypeInput, TypeItem, TypeKind } from '@/types/organization'

const props = defineProps<{ kind: TypeKind; title: string; noun: string; usedBy: string }>()
const { show } = useToast()
const { apply } = useApiErrors()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<TypeItem>()

const rows = ref<TypeItem[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)

async function load() {
  try {
    rows.value = (await api.listTypes(props.kind)).sort((a, b) => a.name.localeCompare(b.name, 'id'))
    loadError.value = null
  } catch (err) {
    loadError.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const columns = [
  { key: 'code', label: 'Kode', width: '130px' },
  { key: 'name', label: 'Nama', width: '1.2fr' },
  { key: 'description', label: 'Deskripsi', width: '1.6fr' },
  { key: 'usageCount', label: 'Dipakai', width: '90px' },
  { key: 'isActive', label: 'Status', width: '90px' },
]

const blank = (): TypeInput => ({ code: '', name: '', description: '', isActive: true })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const isForm = computed(() => mode.value === 'create' || mode.value === 'edit')

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r ? { code: r.code, name: r.name, description: r.description, isActive: r.isActive } : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (isBlank(form.name)) e.name = 'Nama wajib diisi.'
  if (isBlank(form.code)) e.code = 'Kode wajib diisi.'
  return e
}

async function submit() {
  if (saving.value) return
  errors.value = validate()
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    await api.saveType(props.kind, { ...form }, record.value?.id)
    show(mode.value === 'create' ? 'Data berhasil disimpan' : 'Data berhasil diperbarui')
    close()
    await load()
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
        { label: 'Kode', value: r.code },
        { label: 'Nama', value: r.name },
        { label: 'Deskripsi', value: r.description || '-' },
        { label: `Dipakai oleh ${props.usedBy}`, value: String(r.usageCount) },
        { label: 'Status', value: r.isActive ? 'Aktif' : 'Nonaktif' },
      ]
    : []
})

const toDelete = ref<TypeItem | null>(null)
const busy = ref(false)
async function confirmDelete() {
  if (!toDelete.value || busy.value) return
  busy.value = true
  try {
    await api.deleteType(props.kind, toDelete.value.id)
    show('Data berhasil dihapus')
    toDelete.value = null
    await load()
  } catch (err) {
    toDelete.value = null
    apply(err)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="h-[300px] animate-pulse rounded-xl border border-line bg-white" aria-busy="true" :aria-label="`Memuat ${title}`" />
  <p v-else-if="loadError" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{{ loadError }}</p>
  <RecordTable
    v-else
    :title="title"
    :columns="columns"
    :rows="rows"
    deletable
    :empty-text="`Belum ada ${noun}. Tambahkan ${noun} agar bisa dipilih pada formulir.`"
    @add="openCreate" @view="openView" @edit="openEdit" @delete="toDelete = $event"
  >
    <template #cell-name="{ row }"><span class="block truncate font-semibold">{{ row.name }}</span></template>
    <template #cell-isActive="{ row }">
      <StatusBadge :label="row.isActive ? 'Aktif' : 'Nonaktif'" :tone="row.isActive ? 'ok' : 'off'" />
    </template>
  </RecordTable>

  <DetailModal :open="mode === 'view'" :title="`Detail ${noun}`" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? `Ubah ${noun}` : `Tambah ${noun}`"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close"
    @submit="submit"
  >
    <FormField label="Nama" for-id="t-name" required :error="errors.name">
      <input id="t-name" v-model="form.name" class="input" :aria-invalid="!!errors.name" />
    </FormField>
    <FormField label="Kode" for-id="t-code" required :error="errors.code">
      <input id="t-code" v-model="form.code" class="input" :aria-invalid="!!errors.code" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Deskripsi (opsional)" for-id="t-desc">
        <textarea id="t-desc" v-model="form.description" rows="2" class="input" />
      </FormField>
    </div>
    <div class="flex items-center justify-between gap-4 sm:col-span-2">
      <div>
        <p class="text-sm font-semibold">Aktif</p>
        <p class="text-xs text-ink-soft">Data nonaktif tidak muncul sebagai pilihan pada formulir baru.</p>
      </div>
      <ToggleSwitch v-model="form.isActive" label="Aktif" />
    </div>
  </FormModal>

  <ConfirmDialog
    :open="toDelete !== null"
    icon="alert-triangle"
    danger
    :title="`Hapus ${noun}?`"
    :message="`“${toDelete?.name ?? ''}” akan dihapus secara lunak. Data yang masih dipakai tidak dapat dihapus; nonaktifkan saja.`"
    confirm-label="Ya, Hapus"
    @close="toDelete = null"
    @confirm="confirmDelete"
  />
</template>
