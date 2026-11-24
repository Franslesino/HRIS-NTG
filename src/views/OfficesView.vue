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
import { loadReferences, reloadReferences, useReferences } from '@/composables/useReferences'
import { useRegions } from '@/composables/useRegions'
import { useToast } from '@/composables/useToast'
import { isBlank, isPhone } from '@/utils/validators'
import type { Office, OfficeInput, OrgReferences } from '@/types/organization'

const { show } = useToast()
const { apply } = useApiErrors()
const { refs } = useReferences()
const regions = useRegions()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<Office>()

const offices = ref<Office[]>([])
const orgRefs = ref<OrgReferences | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

async function load() {
  try {
    const [o, r] = await Promise.all([api.listOffices(), api.getOrgReferences(), loadReferences()])
    offices.value = o; orgRefs.value = r; loadError.value = null
  } catch (err) {
    loadError.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const search = ref('')
const typeFilter = ref('')
const filtered = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return offices.value
    .filter((o) =>
      (!kw || o.name.toLowerCase().includes(kw) || o.code.toLowerCase().includes(kw) || o.cityName.toLowerCase().includes(kw)) &&
      (!typeFilter.value || o.officeTypeId === typeFilter.value),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))
})
const isFiltering = computed(() => !!(search.value || typeFilter.value))

const columns = [
  { key: 'code', label: 'Kode', width: '100px' },
  { key: 'name', label: 'Nama Kantor', width: '1.5fr' },
  { key: 'officeTypeName', label: 'Jenis', width: '1fr' },
  { key: 'cityName', label: 'Kota/Kabupaten', width: '1.2fr' },
  { key: 'employeeCount', label: 'Pegawai', width: '80px' },
  { key: 'isActive', label: 'Status', width: '90px' },
]

/* ---------- form ---------- */
const blank = (): OfficeInput => ({
  officeTypeId: '', parentOfficeId: '', code: '', name: '', addressLine: '', provinceId: '', cityId: '',
  districtId: '', villageId: '', phoneNumber: '', isActive: true,
})
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const isForm = computed(() => mode.value === 'create' || mode.value === 'edit')

watch(mode, async (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r
      ? {
          officeTypeId: r.officeTypeId, parentOfficeId: r.parentOfficeId, code: r.code, name: r.name, addressLine: r.addressLine,
          provinceId: r.provinceId, cityId: r.cityId, districtId: r.districtId, villageId: r.villageId,
          phoneNumber: r.phoneNumber, isActive: r.isActive,
        }
      : blank())
    await regions.loadChain(form.provinceId, form.cityId, form.districtId)
  }
})
watch(form, () => { if (Object.keys(errors.value).length) errors.value = validate() }, { deep: true })

async function onProvince() { form.cityId = ''; form.districtId = ''; form.villageId = ''; await regions.selectProvince(form.provinceId) }
async function onCity() { form.districtId = ''; form.villageId = ''; await regions.selectCity(form.cityId) }
async function onDistrict() { form.villageId = ''; await regions.selectDistrict(form.districtId) }
const postalCode = computed(() => regions.villages.value.find((v) => v.id === form.villageId)?.postalCode ?? '')
const parentOptions = computed(() => offices.value.filter((o) => o.id !== record.value?.id))

function validate() {
  const e: Record<string, string> = {}
  if (isBlank(form.name)) e.name = 'Nama kantor wajib diisi.'
  if (isBlank(form.code)) e.code = 'Kode kantor wajib diisi.'
  if (!form.officeTypeId) e.officeTypeId = 'Jenis kantor wajib dipilih.'
  if (isBlank(form.addressLine)) e.addressLine = 'Alamat wajib diisi.'
  if (!form.provinceId) e.provinceId = 'Provinsi wajib dipilih.'
  if (!form.cityId) e.cityId = 'Kota/kabupaten wajib dipilih.'
  if (form.phoneNumber && !isPhone(form.phoneNumber)) e.phoneNumber = 'Nomor telepon harus berupa angka, 10-15 digit.'
  return e
}

async function submit() {
  if (saving.value) return
  errors.value = validate()
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    await api.saveOffice({ ...form }, record.value?.id)
    show(mode.value === 'create' ? 'Kantor berhasil ditambahkan' : 'Data kantor berhasil diperbarui')
    close()
    await load()
    void reloadReferences()
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
        { label: 'Nama Kantor', value: r.name },
        { label: 'Jenis Kantor', value: r.officeTypeName },
        { label: 'Kantor Induk', value: r.parentOfficeName || '-' },
        { label: 'Alamat', value: [r.addressLine, r.villageName, r.districtName, r.cityName, r.provinceName].filter(Boolean).join(', ') },
        { label: 'Telepon', value: r.phoneNumber || '-' },
        { label: 'Pegawai Saat Ini', value: String(r.employeeCount) },
        { label: 'Status', value: r.isActive ? 'Aktif' : 'Nonaktif' },
      ]
    : []
})

const toDelete = ref<Office | null>(null)
const busy = ref(false)
async function confirmDelete() {
  if (!toDelete.value || busy.value) return
  busy.value = true
  try {
    await api.deleteOffice(toDelete.value.id)
    show('Kantor berhasil dihapus')
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
  <AppHeader title="Organisasi & Jabatan" :breadcrumb="[{ label: 'Organisasi & Jabatan', to: '/organisasi' }, { label: 'Kantor & Lokasi' }]" />
  <div class="mt-6"><OrgNav /></div>

  <div v-if="loading" class="mt-5 h-[320px] animate-pulse rounded-xl border border-line bg-white" aria-busy="true" aria-label="Memuat kantor" />
  <p v-else-if="loadError" class="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{{ loadError }}</p>

  <template v-else>
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <div class="relative min-w-[240px] flex-1">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"><AppIcon name="search" :size="16" /></span>
        <input v-model="search" class="input pl-9" placeholder="Cari nama, kode, atau kota kantor..." aria-label="Cari kantor" />
      </div>
      <select v-model="typeFilter" class="select w-auto" aria-label="Filter jenis kantor">
        <option value="">Jenis: Semua</option>
        <option v-for="t in orgRefs?.officeTypes ?? []" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <button v-if="isFiltering" type="button" class="btn btn-outline" @click="search = ''; typeFilter = ''">Hapus filter</button>
    </div>

    <div class="mt-4">
      <RecordTable
        title="Daftar Kantor & Lokasi"
        :columns="columns"
        :rows="filtered"
        :page-size="8"
        deletable
        :empty-text="isFiltering ? 'Data tidak ditemukan. Coba ubah kata kunci atau hapus filter.' : 'Belum ada data kantor. Tambahkan kantor untuk mulai menetapkan lokasi kerja pegawai.'"
        @add="openCreate" @view="openView" @edit="openEdit" @delete="toDelete = $event"
      >
        <template #cell-name="{ row }"><span class="block truncate font-semibold">{{ row.name }}</span></template>
        <template #cell-isActive="{ row }">
          <StatusBadge :label="row.isActive ? 'Aktif' : 'Nonaktif'" :tone="row.isActive ? 'ok' : 'off'" />
        </template>
      </RecordTable>
    </div>
  </template>

  <DetailModal :open="mode === 'view'" title="Detail Kantor" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Ubah Kantor' : 'Tambah Kantor'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close"
    @submit="submit"
  >
    <FormField label="Nama Kantor" for-id="o-name" required :error="errors.name">
      <input id="o-name" v-model="form.name" class="input" :aria-invalid="!!errors.name" />
    </FormField>
    <FormField label="Kode Kantor" for-id="o-code" required :error="errors.code">
      <input id="o-code" v-model="form.code" class="input" placeholder="Contoh: KC-SBY" :aria-invalid="!!errors.code" />
    </FormField>
    <FormField label="Jenis Kantor" for-id="o-type" required select :error="errors.officeTypeId">
      <select id="o-type" v-model="form.officeTypeId" class="select" :aria-invalid="!!errors.officeTypeId">
        <option value="" disabled>Pilih jenis kantor</option>
        <option v-for="t in orgRefs?.officeTypes ?? []" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
    </FormField>
    <FormField label="Kantor Induk (opsional)" for-id="o-parent" select :error="errors.parentOfficeId">
      <select id="o-parent" v-model="form.parentOfficeId" class="select" :aria-invalid="!!errors.parentOfficeId">
        <option value="">Tidak ada</option>
        <option v-for="o in parentOptions" :key="o.id" :value="o.id">{{ o.name }}</option>
      </select>
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Alamat Jalan" for-id="o-addr" required :error="errors.addressLine">
        <input id="o-addr" v-model="form.addressLine" class="input" :aria-invalid="!!errors.addressLine" />
      </FormField>
    </div>
    <FormField label="Provinsi" for-id="o-prov" required select :error="errors.provinceId">
      <select id="o-prov" v-model="form.provinceId" class="select" :aria-invalid="!!errors.provinceId" @change="onProvince">
        <option value="" disabled>Pilih provinsi</option>
        <option v-for="p in refs?.provinces ?? []" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </FormField>
    <FormField label="Kota/Kabupaten" for-id="o-city" required select :error="errors.cityId">
      <select id="o-city" v-model="form.cityId" class="select" :disabled="!form.provinceId" :aria-invalid="!!errors.cityId" @change="onCity">
        <option value="" disabled>Pilih kota/kabupaten</option>
        <option v-for="c in regions.cities.value" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </FormField>
    <FormField label="Kecamatan" for-id="o-dist" select :error="errors.districtId">
      <select id="o-dist" v-model="form.districtId" class="select" :disabled="!form.cityId" :aria-invalid="!!errors.districtId" @change="onDistrict">
        <option value="">Pilih kecamatan</option>
        <option v-for="d in regions.districts.value" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
    </FormField>
    <FormField label="Kelurahan/Desa" for-id="o-vil" select :error="errors.villageId">
      <select id="o-vil" v-model="form.villageId" class="select" :disabled="!form.districtId" :aria-invalid="!!errors.villageId">
        <option value="">Pilih kelurahan/desa</option>
        <option v-for="v in regions.villages.value" :key="v.id" :value="v.id">{{ v.name }}</option>
      </select>
    </FormField>
    <FormField label="Kode Pos" for-id="o-postal" hint="Terisi otomatis dari kelurahan/desa.">
      <input id="o-postal" :value="postalCode || '-'" class="input" disabled />
    </FormField>
    <FormField label="Telepon (opsional)" for-id="o-phone" :error="errors.phoneNumber">
      <input id="o-phone" v-model="form.phoneNumber" type="tel" class="input" :aria-invalid="!!errors.phoneNumber" />
    </FormField>
    <div class="flex items-center justify-between gap-4 sm:col-span-2">
      <div>
        <p class="text-sm font-semibold">Kantor Aktif</p>
        <p class="text-xs text-ink-soft">Kantor nonaktif tidak muncul sebagai pilihan penempatan baru.</p>
      </div>
      <ToggleSwitch v-model="form.isActive" label="Kantor aktif" />
    </div>
  </FormModal>

  <ConfirmDialog
    :open="toDelete !== null"
    icon="alert-triangle"
    danger
    title="Hapus Kantor?"
    :message="`Kantor “${toDelete?.name ?? ''}” akan dihapus secara lunak. Kantor yang sudah dipakai pada penempatan pegawai tidak dapat dihapus; nonaktifkan saja.`"
    confirm-label="Ya, Hapus"
    @close="toDelete = null"
    @confirm="confirmDelete"
  />
</template>
