<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import { api, errorMessage } from '@/api'
import { useApiErrors } from '@/composables/useApiErrors'
import { loadReferences, useReferences } from '@/composables/useReferences'
import { useRegions } from '@/composables/useRegions'
import { useToast } from '@/composables/useToast'
import { BLOOD_TYPES, GENDER_LABEL, MARITAL_LABEL, entries } from '@/data/options'
import { emptyForm, positionGroups, toForm, unitPath } from '@/utils/employee'
import { maskLast4 } from '@/utils/format'
import { isBlank, isEmail, isNik, isNip, isNpwp, isPhone } from '@/utils/validators'
import type { EmployeeForm, EmployeeOption, PersonIdentifier } from '@/types/employee'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const { show } = useToast()
const { apply } = useApiErrors()
const { refs } = useReferences()
const regions = useRegions()

const isEdit = computed(() => !!props.id)
const loading = ref(true)
const loadError = ref<string | null>(null)
const saving = ref(false)

const form = reactive<EmployeeForm>(emptyForm())
const errors = ref<Record<string, string>>({})
const submitted = ref(false)
const showExtra = ref(true)
const people = ref<EmployeeOption[]>([])
const savedIdentifiers = ref<PersonIdentifier[]>([])

const genderOptions = entries(GENDER_LABEL)
const maritalOptions = entries(MARITAL_LABEL)

onMounted(async () => {
  try {
    await loadReferences()
    people.value = await api.listEmployeeOptions()
    if (props.id) {
      const detail = await api.getEmployee(props.id)
      if (!detail) { router.replace('/kepegawaian'); return }
      Object.assign(form, toForm(detail))
      savedIdentifiers.value = detail.identifiers
      await regions.loadChain(form.provinceId, form.cityId, form.districtId)
    } else {
      const active = refs.value?.employmentStatuses.find((s) => s.code === 'ACTIVE')
      if (active) form.employmentStatusId = active.id
    }
  } catch (err) {
    loadError.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})

/* ---------- wilayah bertingkat ---------- */
async function onProvince() {
  form.cityId = ''; form.districtId = ''; form.villageId = ''
  await regions.selectProvince(form.provinceId)
}
async function onCity() {
  form.districtId = ''; form.villageId = ''
  await regions.selectCity(form.cityId)
}
async function onDistrict() {
  form.villageId = ''
  await regions.selectDistrict(form.districtId)
}
const postalCode = computed(() => regions.villages.value.find((v) => v.id === form.villageId)?.postalCode ?? '')

/* ---------- penempatan ---------- */
const groups = computed(() => positionGroups(refs.value))
const unitLabel = computed(() => {
  const r = refs.value
  const pos = r?.positions.find((p) => p.id === form.positionId)
  return r && pos ? unitPath(pos.organizationUnitId, r.organizationUnits) : '-'
})
const bossOptions = computed(() => people.value.filter((x) => x.id !== props.id))
const statusOptions = computed(() => refs.value?.employmentStatuses ?? [])
const savedMask = (code: string) => {
  const found = savedIdentifiers.value.find((i) => i.typeCode === code)
  return found ? `Tersimpan: ${maskLast4(found.last4)}. Kosongkan jika tidak diubah.` : undefined
}

function validate(): Record<string, string> {
  const e: Record<string, string> = {}
  if (isBlank(form.fullName)) e.fullName = 'Nama lengkap wajib diisi.'
  if (isBlank(form.employeeNumber)) e.employeeNumber = 'Nomor pegawai wajib diisi.'
  if (!form.gender) e.gender = 'Jenis kelamin wajib dipilih.'
  // identitas sensitif: saat edit boleh dikosongkan (tidak diubah)
  if (!isEdit.value || form.nik) {
    if (!isNik(form.nik)) e.nik = 'NIK harus terdiri dari 16 digit angka.'
  }
  if (form.npwp && !isNpwp(form.npwp)) e.npwp = 'NPWP harus 15 atau 16 digit angka.'
  if (form.nip && !isNip(form.nip)) e.nip = 'NIP harus 18 digit angka.'
  if (!form.startDate) e.startDate = 'Tanggal bergabung wajib diisi.'
  if (isBlank(form.workEmail)) e.workEmail = 'Email kantor wajib diisi.'
  else if (!isEmail(form.workEmail)) e.workEmail = 'Format email tidak valid. Contoh: nama@bmis.id.'
  if (form.personalEmail && !isEmail(form.personalEmail)) e.personalEmail = 'Format email tidak valid.'
  if (!isPhone(form.phoneNumber)) e.phoneNumber = 'Nomor HP harus berupa angka, 10-15 digit.'
  if (form.workPhone && !isPhone(form.workPhone)) e.workPhone = 'Nomor telepon harus berupa angka, 10-15 digit.'
  if (isBlank(form.addressLine)) e.addressLine = 'Alamat jalan wajib diisi.'
  if (!form.provinceId) e.provinceId = 'Provinsi wajib dipilih.'
  if (!form.cityId) e.cityId = 'Kota/kabupaten wajib dipilih.'
  if (!form.positionId) e.positionId = 'Jabatan wajib dipilih.'
  if (!form.employmentTypeId) e.employmentTypeId = 'Jenis kepegawaian wajib dipilih.'
  if (!form.employmentStatusId) e.employmentStatusId = 'Status kepegawaian wajib dipilih.'
  if (props.id && form.reportsToEmployeeId === props.id) e.reportsToEmployeeId = 'Atasan tidak boleh pegawai itu sendiri.'
  return e
}

// Setelah percobaan simpan pertama, error ikut diperbarui saat pengguna mengetik
watch(form, () => { if (submitted.value) errors.value = validate() }, { deep: true })

const errorCount = computed(() => Object.keys(errors.value).length)

async function focusFirstError() {
  await nextTick()
  const first = document.querySelector<HTMLElement>('[aria-invalid="true"]')
  first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  first?.focus({ preventScroll: true })
}

async function submit() {
  if (saving.value) return
  submitted.value = true
  errors.value = validate()
  if (errorCount.value) return focusFirstError()

  saving.value = true
  try {
    if (!isEdit.value && (await api.isEmployeeNumberTaken(form.employeeNumber))) {
      errors.value = { employeeNumber: 'Nomor pegawai sudah digunakan.' }
      return focusFirstError()
    }
    if (isEdit.value && props.id) {
      await api.updateEmployee(props.id, form)
      show('Data pegawai berhasil diperbarui')
      goBack()
    } else {
      const created = await api.createEmployee(form)
      show('Data pegawai berhasil disimpan')
      router.replace(`/kepegawaian/${created.id}`)
    }
  } catch (err) {
    apply(err, errors)
    await focusFirstError()
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push(isEdit.value ? `/kepegawaian/${props.id}` : '/kepegawaian')
}

const crumbs = computed(() => [
  { label: 'Kepegawaian', to: '/kepegawaian' },
  { label: isEdit.value ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru' },
])
const section = 'text-sm font-semibold border-b border-line pb-2'
const grid = 'mt-4 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2'
</script>

<template>
  <AppHeader :title="isEdit ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'" :breadcrumb="crumbs" />

  <div v-if="loading" class="mt-8 h-[420px] animate-pulse rounded-xl border border-line bg-white" aria-busy="true" aria-label="Memuat formulir" />

  <p
    v-else-if="loadError"
    class="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    role="alert"
  >
    {{ loadError }}
  </p>

  <form v-else class="mt-8 space-y-4" novalidate @submit.prevent="submit">
    <p
      v-if="submitted && errorCount"
      class="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600"
      role="alert"
    >
      <AppIcon name="alert-circle" :size="16" />
      Data belum lengkap atau format salah. Periksa kembali isian Anda.
    </p>

    <div class="space-y-8 rounded-xl border border-line bg-white p-6">
      <!-- Identitas -->
      <section>
        <h2 :class="section">Identitas Diri</h2>
        <div :class="grid">
          <FormField label="Nama Lengkap" for-id="f-name" required :error="errors.fullName" hint="Masukkan nama lengkap sesuai identitas resmi tanpa singkatan.">
            <input id="f-name" v-model="form.fullName" class="input" :aria-invalid="!!errors.fullName" />
          </FormField>
          <FormField label="Nomor Pegawai" for-id="f-number" required :error="errors.employeeNumber" hint="Nomor unik pegawai; tidak dapat diubah setelah disimpan.">
            <input id="f-number" v-model="form.employeeNumber" class="input" placeholder="EMP-2024-0001" :disabled="isEdit" :aria-invalid="!!errors.employeeNumber" />
          </FormField>

          <FormField label="NIK" for-id="f-nik" :required="!isEdit" :error="errors.nik" :hint="isEdit ? savedMask('NIK') : 'Nomor Induk Kependudukan (NIK) sesuai KTP.'">
            <input id="f-nik" v-model="form.nik" class="input" inputmode="numeric" maxlength="16" autocomplete="off" :aria-invalid="!!errors.nik" />
          </FormField>
          <FormField label="Tanggal Lahir" for-id="f-bdate">
            <input id="f-bdate" v-model="form.birthDate" type="date" class="input" />
          </FormField>

          <FormField label="Jenis Kelamin" for-id="f-gender" required select :error="errors.gender">
            <select id="f-gender" v-model="form.gender" class="select" :aria-invalid="!!errors.gender">
              <option value="" disabled>Pilih jenis kelamin</option>
              <option v-for="g in genderOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
          </FormField>
          <FormField label="Status Pernikahan" for-id="f-marital" select>
            <select id="f-marital" v-model="form.maritalStatus" class="select">
              <option value="">Pilih status pernikahan</option>
              <option v-for="m in maritalOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </FormField>

          <FormField label="Gelar Depan (opsional)" for-id="f-front">
            <input id="f-front" v-model="form.frontTitle" class="input" placeholder="Contoh: Dr." />
          </FormField>
          <FormField label="Gelar Belakang (opsional)" for-id="f-back">
            <input id="f-back" v-model="form.backTitle" class="input" placeholder="Contoh: S.Kom." />
          </FormField>
        </div>
      </section>

      <!-- Kontak -->
      <section>
        <h2 :class="section">Kontak</h2>
        <div :class="grid">
          <FormField label="Email Kantor" for-id="f-email" required :error="errors.workEmail">
            <input id="f-email" v-model="form.workEmail" type="email" class="input" placeholder="nama@bmis.id" :aria-invalid="!!errors.workEmail" />
          </FormField>
          <FormField label="Telepon Kantor (opsional)" for-id="f-wphone" :error="errors.workPhone">
            <input id="f-wphone" v-model="form.workPhone" type="tel" class="input" :aria-invalid="!!errors.workPhone" />
          </FormField>
          <FormField label="Nomor HP Pribadi" for-id="f-phone" required :error="errors.phoneNumber">
            <input id="f-phone" v-model="form.phoneNumber" type="tel" class="input" placeholder="0812 3456 7890" :aria-invalid="!!errors.phoneNumber" />
          </FormField>
          <FormField label="Email Pribadi (opsional)" for-id="f-pemail" :error="errors.personalEmail">
            <input id="f-pemail" v-model="form.personalEmail" type="email" class="input" :aria-invalid="!!errors.personalEmail" />
          </FormField>
        </div>
      </section>

      <!-- Alamat -->
      <section>
        <h2 :class="section">Alamat</h2>
        <div :class="grid">
          <div class="md:col-span-2">
            <FormField label="Alamat Jalan" for-id="f-street" required :error="errors.addressLine">
              <input id="f-street" v-model="form.addressLine" class="input" :aria-invalid="!!errors.addressLine" />
            </FormField>
          </div>
          <FormField label="Provinsi" for-id="f-province" required select :error="errors.provinceId">
            <select id="f-province" v-model="form.provinceId" class="select" :aria-invalid="!!errors.provinceId" @change="onProvince">
              <option value="" disabled>Pilih provinsi</option>
              <option v-for="p in refs?.provinces ?? []" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </FormField>
          <FormField label="Kota/Kabupaten" for-id="f-city" required select :error="errors.cityId">
            <select id="f-city" v-model="form.cityId" class="select" :disabled="!form.provinceId" :aria-invalid="!!errors.cityId" @change="onCity">
              <option value="" disabled>Pilih kota/kabupaten</option>
              <option v-for="c in regions.cities.value" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </FormField>
          <FormField label="Kecamatan" for-id="f-district" select :error="errors.districtId">
            <select id="f-district" v-model="form.districtId" class="select" :disabled="!form.cityId" :aria-invalid="!!errors.districtId" @change="onDistrict">
              <option value="">Pilih kecamatan</option>
              <option v-for="d in regions.districts.value" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </FormField>
          <FormField label="Kelurahan/Desa" for-id="f-village" select :error="errors.villageId">
            <select id="f-village" v-model="form.villageId" class="select" :disabled="!form.districtId" :aria-invalid="!!errors.villageId">
              <option value="">Pilih kelurahan/desa</option>
              <option v-for="v in regions.villages.value" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </FormField>
          <FormField label="Kode Pos" for-id="f-postal" hint="Terisi otomatis dari kelurahan/desa.">
            <input id="f-postal" :value="postalCode || '-'" class="input" disabled />
          </FormField>
        </div>
      </section>

      <!-- Jabatan -->
      <section>
        <h2 :class="section">Jabatan &amp; Unit Kerja</h2>
        <div :class="grid">
          <FormField label="Jabatan" for-id="f-position" required select :error="errors.positionId">
            <select id="f-position" v-model="form.positionId" class="select" :aria-invalid="!!errors.positionId">
              <option value="" disabled>Pilih jabatan</option>
              <optgroup v-for="g in groups" :key="g.label" :label="g.label">
                <option v-for="p in g.items" :key="p.id" :value="p.id">{{ p.name }}</option>
              </optgroup>
            </select>
          </FormField>
          <FormField label="Unit Kerja" for-id="f-unit" hint="Mengikuti jabatan yang dipilih.">
            <input id="f-unit" :value="unitLabel" class="input" disabled />
          </FormField>
          <FormField label="Kantor" for-id="f-office" select>
            <select id="f-office" v-model="form.officeId" class="select">
              <option value="">Pilih kantor</option>
              <option v-for="o in refs?.offices ?? []" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </FormField>
          <FormField label="Atasan Langsung" for-id="f-boss" select :error="errors.reportsToEmployeeId">
            <select id="f-boss" v-model="form.reportsToEmployeeId" class="select" :aria-invalid="!!errors.reportsToEmployeeId">
              <option value="">Tidak ada</option>
              <option v-for="b in bossOptions" :key="b.id" :value="b.id">{{ b.fullName }} ({{ b.employeeNumber }})</option>
            </select>
          </FormField>
          <FormField label="Tanggal Bergabung" for-id="f-join" required :error="errors.startDate">
            <input id="f-join" v-model="form.startDate" type="date" class="input" :aria-invalid="!!errors.startDate" />
          </FormField>
        </div>
      </section>

      <!-- Status -->
      <section>
        <h2 :class="section">Status &amp; Kepegawaian</h2>
        <div :class="grid">
          <fieldset :disabled="isEdit">
            <legend class="mb-1.5 text-xs font-semibold">Status Kepegawaian<span class="ml-0.5 text-red-500">*</span></legend>
            <div class="space-y-1.5">
              <label v-for="s in statusOptions" :key="s.id" class="flex items-center gap-2 text-sm">
                <input v-model="form.employmentStatusId" type="radio" name="status" :value="s.id" class="h-4 w-4 accent-brand-500" />
                {{ s.name }}
              </label>
            </div>
            <p v-if="isEdit" class="mt-1.5 text-xs text-ink-soft">
              Untuk mengubah status, gunakan “Ubah Status Kepegawaian” di profil pegawai agar tercatat di riwayat.
            </p>
            <p v-if="errors.employmentStatusId" class="mt-1.5 text-xs text-red-600" role="alert">{{ errors.employmentStatusId }}</p>
          </fieldset>
          <FormField label="Jenis Kepegawaian" for-id="f-type" required select :error="errors.employmentTypeId">
            <select id="f-type" v-model="form.employmentTypeId" class="select" :aria-invalid="!!errors.employmentTypeId">
              <option value="" disabled>Pilih jenis kepegawaian</option>
              <option v-for="t in refs?.employmentTypes ?? []" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </FormField>
        </div>
      </section>

      <!-- Data tambahan -->
      <section>
        <h2 :class="section">Data Tambahan</h2>
        <div class="mt-4 rounded-lg border border-line bg-surface p-4">
          <button
            type="button"
            class="flex w-full items-center justify-between text-xs font-semibold"
            :aria-expanded="showExtra"
            @click="showExtra = !showExtra"
          >
            Data tambahan (opsional)
            <AppIcon :name="showExtra ? 'chevron-up' : 'chevron-down'" :size="14" />
          </button>
          <div v-if="showExtra" class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="NIP" for-id="f-nip" :error="errors.nip" :hint="isEdit ? savedMask('NIP') : undefined">
              <input id="f-nip" v-model="form.nip" class="input" inputmode="numeric" autocomplete="off" :aria-invalid="!!errors.nip" />
            </FormField>
            <FormField label="NPWP" for-id="f-npwp" :error="errors.npwp" :hint="isEdit ? savedMask('NPWP') : undefined">
              <input id="f-npwp" v-model="form.npwp" class="input" placeholder="12.345.678.9-012.000" autocomplete="off" :aria-invalid="!!errors.npwp" />
            </FormField>
            <FormField label="Agama" for-id="f-religion" select>
              <select id="f-religion" v-model="form.religionId" class="select">
                <option value="">Pilih agama</option>
                <option v-for="r in refs?.religions ?? []" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </FormField>
            <FormField label="Golongan Darah" for-id="f-blood" select>
              <select id="f-blood" v-model="form.bloodType" class="select">
                <option value="">Pilih golongan darah</option>
                <option v-for="b in BLOOD_TYPES" :key="b" :value="b">{{ b }}</option>
              </select>
            </FormField>
          </div>
        </div>
      </section>
    </div>

    <div class="space-y-3 rounded-xl border border-line bg-white p-4">
      <button type="submit" class="btn btn-primary h-10 w-full" :disabled="saving">
        {{ saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Data Pegawai' }}
      </button>
      <button type="button" class="btn btn-outline h-10 w-full" :disabled="saving" @click="goBack">Batal</button>
    </div>
  </form>
</template>
