<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import { DEPARTMENTS, POSITIONS, TYPES, STATUSES } from '@/data/seed'
import { BLOOD_TYPES, GENDERS, MARITAL_STATUSES, RELIGIONS } from '@/data/options'
import { emptyForm, employeeStore, toForm } from '@/stores/employeeStore'
import { useToast } from '@/composables/useToast'
import { isBlank, isEmail, isNik, isPhone } from '@/utils/validators'
import type { EmployeeForm } from '@/types/employee'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const { show } = useToast()

const isEdit = computed(() => !!props.id)
const original = props.id ? employeeStore.find(props.id) : undefined
if (props.id && !original) router.replace('/kepegawaian')

const form = reactive<EmployeeForm>(original ? toForm(original) : emptyForm())
const errors = ref<Record<string, string>>({})
const submitted = ref(false)
const showExtra = ref(true)
const photoError = ref('')

const positions = computed(() =>
  form.position && !POSITIONS.includes(form.position) ? [form.position, ...POSITIONS] : POSITIONS,
)

function validate(): Record<string, string> {
  const e: Record<string, string> = {}
  if (isBlank(form.name)) e.name = 'Nama lengkap wajib diisi.'
  if (isBlank(form.id)) e.id = 'ID pegawai wajib diisi.'
  else if (!isEdit.value && employeeStore.exists(form.id)) e.id = 'ID pegawai sudah digunakan.'
  if (!form.gender) e.gender = 'Jenis kelamin wajib dipilih.'
  if (!isNik(form.nik)) e.nik = 'NIK harus terdiri dari 16 digit angka.'
  if (!form.joinDate) e.joinDate = 'Tanggal bergabung wajib diisi.'
  if (isBlank(form.email)) e.email = 'Email kantor wajib diisi.'
  else if (!isEmail(form.email)) e.email = 'Format email tidak valid. Contoh: nama@bmis.id.'
  if (!isPhone(form.phone)) e.phone = 'Nomor HP harus berupa angka, 10-15 digit.'
  if (isBlank(form.street)) e.street = 'Alamat jalan wajib diisi.'
  if (isBlank(form.city)) e.city = 'Kota/kabupaten wajib diisi.'
  if (isBlank(form.province)) e.province = 'Provinsi wajib diisi.'
  if (!form.position) e.position = 'Jabatan struktural wajib dipilih.'
  if (!form.department) e.department = 'Unit kerja/divisi wajib dipilih.'
  if (!form.type) e.type = 'Jenis kepegawaian wajib dipilih.'
  if (form.childCount !== '' && !/^\d{1,2}$/.test(form.childCount)) e.childCount = 'Jumlah anak harus berupa angka.'
  return e
}

// Setelah percobaan simpan pertama, error ikut diperbarui saat pengguna mengetik
watch(form, () => { if (submitted.value) errors.value = validate() }, { deep: true })

const errorCount = computed(() => Object.keys(errors.value).length)

async function submit() {
  submitted.value = true
  errors.value = validate()
  if (errorCount.value) {
    await nextTick()
    const first = document.querySelector<HTMLElement>('[aria-invalid="true"]')
    first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    first?.focus({ preventScroll: true })
    return
  }
  if (isEdit.value && props.id) {
    employeeStore.update(props.id, form)
    show('Data pegawai berhasil diperbarui')
    goBack()
  } else {
    const created = employeeStore.create(form)
    show('Data pegawai berhasil disimpan')
    router.replace(`/kepegawaian/${created.id}`)
  }
}

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push(isEdit.value ? `/kepegawaian/${props.id}` : '/kepegawaian')
}

function onPhoto(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  photoError.value = ''
  if (!file) return
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    photoError.value = 'Format foto harus PNG atau JPG.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    photoError.value = 'Ukuran foto maksimal 5 MB.'
    return
  }
  form.photo = URL.createObjectURL(file)
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

  <form class="mt-8 space-y-4" novalidate @submit.prevent="submit">
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
          <FormField label="Nama Lengkap" for-id="f-name" required :error="errors.name" hint="Masukkan nama lengkap sesuai identitas resmi tanpa singkatan.">
            <input id="f-name" v-model="form.name" class="input" :aria-invalid="!!errors.name" />
          </FormField>
          <FormField label="ID Pegawai" for-id="f-id" required :error="errors.id" hint="ID unik sistem kepegawaian yang tidak dapat diubah kembali.">
            <input id="f-id" v-model="form.id" class="input" placeholder="EMP-2024-0001" :disabled="isEdit" :aria-invalid="!!errors.id" />
          </FormField>

          <FormField label="Foto Pegawai" for-id="f-photo" :error="photoError">
            <label
              for="f-photo"
              class="flex h-[88px] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-dashed border-gray-300 bg-surface px-3 text-center text-xs text-ink-soft hover:border-brand-500"
            >
              <img v-if="form.photo" :src="form.photo" alt="Pratinjau foto pegawai" class="h-full w-full object-contain" />
              <template v-else>
                <AppIcon name="upload" :size="16" />
                Unggah foto pegawai (PNG/JPG, max 5 MB)
              </template>
            </label>
            <input id="f-photo" type="file" accept="image/png,image/jpeg" class="sr-only" @change="onPhoto" />
            <button v-if="form.photo" type="button" class="mt-1 text-xs text-red-600 hover:underline" @click="form.photo = ''">
              Hapus foto
            </button>
          </FormField>
          <FormField label="NIK" for-id="f-nik" required :error="errors.nik" hint="Nomor Induk Kependudukan (NIK) sesuai KTP.">
            <input id="f-nik" v-model="form.nik" class="input" inputmode="numeric" maxlength="16" :aria-invalid="!!errors.nik" />
          </FormField>

          <FormField label="Tempat Lahir" for-id="f-bplace">
            <input id="f-bplace" v-model="form.birthPlace" class="input" />
          </FormField>
          <FormField label="Tanggal Lahir" for-id="f-bdate">
            <input id="f-bdate" v-model="form.birthDate" type="date" class="input" />
          </FormField>

          <FormField label="Jenis Kelamin" for-id="f-gender" required select :error="errors.gender">
            <select id="f-gender" v-model="form.gender" class="select" :aria-invalid="!!errors.gender">
              <option value="" disabled>Pilih jenis kelamin</option>
              <option v-for="g in GENDERS" :key="g">{{ g }}</option>
            </select>
          </FormField>
          <FormField label="Status Pernikahan" for-id="f-marital" select>
            <select id="f-marital" v-model="form.maritalStatus" class="select">
              <option value="">Pilih status pernikahan</option>
              <option v-for="m in MARITAL_STATUSES" :key="m">{{ m }}</option>
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
          <FormField label="Email Kantor" for-id="f-email" required :error="errors.email">
            <input id="f-email" v-model="form.email" type="email" class="input" placeholder="nama@bmis.id" :aria-invalid="!!errors.email" />
          </FormField>
          <FormField label="Nomor Telepon/HP" for-id="f-phone" required :error="errors.phone">
            <input id="f-phone" v-model="form.phone" type="tel" class="input" placeholder="0812 3456 7890" :aria-invalid="!!errors.phone" />
          </FormField>
        </div>
      </section>

      <!-- Alamat -->
      <section>
        <h2 :class="section">Alamat</h2>
        <div :class="grid">
          <FormField label="Alamat Jalan" for-id="f-street" required :error="errors.street">
            <input id="f-street" v-model="form.street" class="input" :aria-invalid="!!errors.street" />
          </FormField>
          <FormField label="RT" for-id="f-rt"><input id="f-rt" v-model="form.rt" class="input" inputmode="numeric" /></FormField>
          <FormField label="RW" for-id="f-rw"><input id="f-rw" v-model="form.rw" class="input" inputmode="numeric" /></FormField>
          <FormField label="Kelurahan/Desa" for-id="f-village"><input id="f-village" v-model="form.village" class="input" /></FormField>
          <FormField label="Kecamatan" for-id="f-district"><input id="f-district" v-model="form.district" class="input" /></FormField>
          <FormField label="Kota/Kabupaten" for-id="f-city" required :error="errors.city">
            <input id="f-city" v-model="form.city" class="input" :aria-invalid="!!errors.city" />
          </FormField>
          <FormField label="Provinsi" for-id="f-province" required :error="errors.province">
            <input id="f-province" v-model="form.province" class="input" :aria-invalid="!!errors.province" />
          </FormField>
          <FormField label="Kode Pos" for-id="f-postal"><input id="f-postal" v-model="form.postalCode" class="input" inputmode="numeric" /></FormField>
        </div>
      </section>

      <!-- Jabatan -->
      <section>
        <h2 :class="section">Jabatan &amp; Unit Kerja</h2>
        <div :class="grid">
          <FormField label="Jabatan Struktural" for-id="f-position" required select :error="errors.position">
            <select id="f-position" v-model="form.position" class="select" :aria-invalid="!!errors.position">
              <option value="" disabled>Pilih jabatan</option>
              <option v-for="p in positions" :key="p">{{ p }}</option>
            </select>
          </FormField>
          <FormField label="Unit Kerja/Divisi" for-id="f-dept" required select :error="errors.department">
            <select id="f-dept" v-model="form.department" class="select" :aria-invalid="!!errors.department">
              <option value="" disabled>Pilih unit kerja</option>
              <option v-for="d in DEPARTMENTS" :key="d">{{ d }}</option>
            </select>
          </FormField>
          <FormField label="Nama Divisi" for-id="f-division"><input id="f-division" v-model="form.division" class="input" placeholder="Contoh: Divisi Teknologi Informasi" /></FormField>
          <FormField label="Kantor" for-id="f-office"><input id="f-office" v-model="form.office" class="input" placeholder="Contoh: Kantor Pusat Bandung" /></FormField>
          <FormField label="Atasan Langsung" for-id="f-supervisor"><input id="f-supervisor" v-model="form.supervisor" class="input" placeholder="Nama atasan langsung" /></FormField>
          <FormField label="Tanggal Bergabung" for-id="f-join" required :error="errors.joinDate">
            <input id="f-join" v-model="form.joinDate" type="date" class="input" :aria-invalid="!!errors.joinDate" />
          </FormField>
        </div>
      </section>

      <!-- Status -->
      <section>
        <h2 :class="section">Status &amp; Kepegawaian</h2>
        <div :class="grid">
          <fieldset>
            <legend class="mb-1.5 text-xs font-semibold">Status Kepegawaian<span class="ml-0.5 text-red-500">*</span></legend>
            <div class="space-y-1.5">
              <label v-for="s in STATUSES" :key="s" class="flex items-center gap-2 text-sm">
                <input v-model="form.status" type="radio" name="status" :value="s" class="h-4 w-4 accent-brand-500" />
                {{ s }}
              </label>
            </div>
          </fieldset>
          <FormField label="Jenis Kepegawaian" for-id="f-type" required select :error="errors.type">
            <select id="f-type" v-model="form.type" class="select" :aria-invalid="!!errors.type">
              <option value="" disabled>Pilih jenis kepegawaian</option>
              <option v-for="t in TYPES" :key="t">{{ t }}</option>
            </select>
          </FormField>
          <FormField label="Jumlah Anak" for-id="f-child" :error="errors.childCount">
            <input id="f-child" v-model="form.childCount" class="input" inputmode="numeric" :aria-invalid="!!errors.childCount" />
          </FormField>
          <FormField label="NPWP" for-id="f-npwp"><input id="f-npwp" v-model="form.npwp" class="input" placeholder="12.345.678.9-012.000" /></FormField>
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
            <FormField label="NIP" for-id="f-nip"><input id="f-nip" v-model="form.nip" class="input" /></FormField>
            <FormField label="Agama" for-id="f-religion" select>
              <select id="f-religion" v-model="form.religion" class="select">
                <option value="">Pilih agama</option>
                <option v-for="r in RELIGIONS" :key="r">{{ r }}</option>
              </select>
            </FormField>
            <FormField label="Golongan Darah" for-id="f-blood" select>
              <select id="f-blood" v-model="form.bloodType" class="select">
                <option value="">Pilih golongan darah</option>
                <option v-for="b in BLOOD_TYPES" :key="b">{{ b }}</option>
              </select>
            </FormField>
          </div>
        </div>
      </section>
    </div>

    <div class="space-y-3 rounded-xl border border-line bg-white p-4">
      <button type="submit" class="btn btn-primary h-10 w-full">
        {{ isEdit ? 'Simpan Perubahan' : 'Simpan Data Pegawai' }}
      </button>
      <button type="button" class="btn btn-outline h-10 w-full" @click="goBack">Batal</button>
    </div>
  </form>
</template>
