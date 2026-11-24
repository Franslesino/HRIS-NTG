<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import FormModal from '@/components/ui/FormModal.vue'
import FormField from '@/components/ui/FormField.vue'
import InfoCard, { type InfoField } from './InfoCard.vue'
import { api } from '@/api'
import { useApiErrors } from '@/composables/useApiErrors'
import { useReferences } from '@/composables/useReferences'
import { useToast } from '@/composables/useToast'
import { APPROVAL_LABEL, GENDER_LABEL, MARITAL_LABEL, USER_STATUS_LABEL, label } from '@/data/options'
import { displayAssignment, statusTone, todayIso } from '@/utils/employee'
import { formatDate, formatLongDate, maskLast4, orDash } from '@/utils/format'
import { isBlank } from '@/utils/validators'
import type { EmployeeDetail, StatusChangeInput } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const emit = defineEmits<{ refresh: [] }>()
const { show } = useToast()
const { apply } = useApiErrors()
const { refs } = useReferences()

const e = computed(() => props.employee)
const p = computed(() => e.value.person)
const cur = computed(() => displayAssignment(e.value.assignments))
const print = () => window.print()

const identifier = (code: string) => {
  const found = e.value.identifiers.find((i) => i.typeCode === code)
  return found ? maskLast4(found.last4) : '-'
}

const identitas = computed<InfoField[]>(() => [
  { label: 'Nama Lengkap', value: p.value.fullName },
  { label: 'Gelar Depan', value: orDash(p.value.frontTitle) },
  { label: 'Gelar Belakang', value: orDash(p.value.backTitle) },
  { label: 'Nomor Pegawai', value: e.value.employeeNumber },
  { label: 'NIP', value: identifier('NIP') },
  { label: 'NIK', value: identifier('NIK') },
  { label: 'NPWP', value: identifier('NPWP') },
  { label: 'Tanggal Lahir', value: formatLongDate(p.value.birthDate) },
  { label: 'Jenis Kelamin', value: label(GENDER_LABEL, p.value.gender) },
  { label: 'Golongan Darah', value: orDash(p.value.bloodType) },
  { label: 'Agama', value: orDash(p.value.religion?.name) },
  { label: 'Status Pernikahan', value: label(MARITAL_LABEL, p.value.maritalStatus) },
])
const kontak = computed<InfoField[]>(() => [
  { label: 'Email Kantor', value: orDash(e.value.workEmail) },
  { label: 'Telepon Kantor', value: orDash(e.value.workPhone) },
  { label: 'Nomor HP Pribadi', value: orDash(p.value.phoneNumber) },
  { label: 'Email Pribadi', value: orDash(p.value.personalEmail) },
])
const alamat = computed<InfoField[]>(() => [
  { label: 'Alamat Jalan', value: orDash(p.value.addressLine), wide: true },
  { label: 'Provinsi', value: orDash(p.value.province?.name) },
  { label: 'Kota / Kabupaten', value: orDash(p.value.city?.name) },
  { label: 'Kecamatan', value: orDash(p.value.district?.name) },
  { label: 'Kelurahan / Desa', value: orDash(p.value.village?.name) },
  { label: 'Kode Pos', value: orDash(p.value.village?.postalCode) },
])
const penempatan = computed<InfoField[]>(() => {
  const a = cur.value
  return [
    { label: 'Jabatan', value: orDash(a?.positionName) },
    { label: 'Departemen', value: orDash(a ? a.parentUnitName || a.unitName : '') },
    { label: 'Divisi', value: orDash(a?.parentUnitName ? a.unitName : '') },
    { label: 'Kantor', value: orDash(a?.officeName) },
    { label: 'Atasan Langsung', value: orDash(a?.reportsToName) },
  ]
})
const kepegawaian = computed<InfoField[]>(() => [
  { label: 'Jenis Kepegawaian', value: e.value.employmentType.name },
  { label: 'Status Kepegawaian', value: e.value.employmentStatus.name, slot: 'status' },
  { label: 'Tanggal Bergabung', value: formatLongDate(e.value.startDate) },
  { label: 'Tanggal Berakhir', value: formatLongDate(e.value.endDate) },
  {
    label: 'Status Akun',
    value: e.value.accountStatus ? USER_STATUS_LABEL[e.value.accountStatus] : 'Belum Diundang',
    slot: 'account',
  },
])

/* ---------- status akun (authorize.users.status) ---------- */
const accountStatus = computed(() => e.value.accountStatus)
const canDisable = computed(() => accountStatus.value === 'ACTIVE' || accountStatus.value === 'LOCKED')
const canEnable = computed(() => accountStatus.value === 'DISABLED')
const dialog = ref<'deactivate' | 'activate' | null>(null)
const busy = ref(false)

async function confirmAccount() {
  if (busy.value || !dialog.value) return
  busy.value = true
  try {
    await api.setAccountStatus(e.value.id, dialog.value === 'deactivate' ? 'DISABLED' : 'ACTIVE')
    dialog.value = null
    show('Status akun berhasil diperbarui')
    emit('refresh')
  } catch (err) {
    dialog.value = null
    apply(err)
  } finally {
    busy.value = false
  }
}

/* ---------- ubah status kepegawaian (employment_status_histories) ---------- */
const statusModal = ref(false)
const blank = (): StatusChangeInput => ({ newStatusId: '', effectiveFrom: todayIso(), decreeNumber: '', decreeDate: '', reason: '' })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const statusOptions = computed(() => (refs.value?.employmentStatuses ?? []).filter((s) => s.id !== e.value.employmentStatus.id))

watch(statusModal, (open) => {
  if (open) { Object.assign(form, blank()); errors.value = {} }
})

function validate() {
  const x: Record<string, string> = {}
  if (!form.newStatusId) x.newStatusId = 'Status baru wajib dipilih.'
  if (!form.effectiveFrom) x.effectiveFrom = 'Tanggal efektif wajib diisi.'
  if (isBlank(form.reason)) x.reason = 'Alasan perubahan wajib diisi.'
  errors.value = x
  return Object.keys(x).length === 0
}

async function submitStatus() {
  if (busy.value || !validate()) return
  busy.value = true
  try {
    await api.changeEmploymentStatus(e.value.id, { ...form })
    statusModal.value = false
    show('Status kepegawaian berhasil diperbarui')
    emit('refresh')
  } catch (err) {
    apply(err, errors)
  } finally {
    busy.value = false
  }
}

const approvalClass = (s: string) =>
  s === 'APPROVED' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
  : s === 'REJECTED' ? 'border-red-500 bg-red-50 text-red-600'
  : 'border-amber-400 bg-amber-50 text-amber-600'
</script>

<template>
  <section class="rounded-xl border border-line bg-white p-6">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <h2 class="text-sm font-semibold">Data Pegawai</h2>
      <div class="flex flex-wrap gap-2 print:hidden">
        <button type="button" class="btn btn-primary" @click="print">
          <AppIcon name="download" :size="14" /> Export PDF
        </button>
        <button type="button" class="btn btn-outline" @click="statusModal = true">Ubah Status Kepegawaian</button>
        <button v-if="canDisable" type="button" class="btn btn-danger-outline" @click="dialog = 'deactivate'">
          Nonaktifkan Akun
        </button>
        <button v-else-if="canEnable" type="button" class="btn btn-brand-outline" @click="dialog = 'activate'">
          Aktifkan Kembali Akun
        </button>
      </div>
    </div>

    <div class="mt-5 grid gap-4 lg:grid-cols-2">
      <div class="space-y-4">
        <InfoCard title="Identitas Diri" :fields="identitas" />
        <InfoCard title="Kontak" :fields="kontak" />
      </div>
      <div class="space-y-4">
        <InfoCard title="Alamat" :fields="alamat" />
        <InfoCard title="Jabatan & Unit Kerja" :fields="penempatan" />
      </div>
    </div>

    <InfoCard class="mt-4" title="Status Kepegawaian" :fields="kepegawaian">
      <template #status>
        <StatusBadge :label="e.employmentStatus.name" :tone="statusTone(e.employmentStatus)" />
      </template>
      <template #account="{ value }">
        <span
          class="inline-block rounded border px-2 py-0.5 text-xs"
          :class="accountStatus === 'ACTIVE' ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-300 bg-gray-50 text-ink-soft'"
        >
          {{ value }}
        </span>
      </template>
    </InfoCard>

    <section class="mt-4 rounded-lg border border-line bg-slate-50/60 p-4">
      <h3 class="text-sm font-semibold">Riwayat Status Kepegawaian</h3>
      <p v-if="e.statusHistories.length === 0" class="mt-3 text-sm text-ink-soft">Belum ada riwayat status.</p>
      <div v-else class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="text-xs text-ink-soft">
            <tr>
              <th class="py-1.5 pr-3 font-normal">Tanggal Efektif</th>
              <th class="py-1.5 pr-3 font-normal">Perubahan</th>
              <th class="py-1.5 pr-3 font-normal">No. SK</th>
              <th class="py-1.5 pr-3 font-normal">Persetujuan</th>
              <th class="py-1.5 font-normal">Alasan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in e.statusHistories" :key="h.id" class="border-t border-line align-top">
              <td class="py-2 pr-3">{{ formatDate(h.effectiveFrom) }}</td>
              <td class="py-2 pr-3">
                <span v-if="h.previousStatusName">{{ h.previousStatusName }} → </span>{{ h.newStatusName }}
              </td>
              <td class="py-2 pr-3">{{ orDash(h.decreeNumber) }}</td>
              <td class="py-2 pr-3">
                <span class="inline-block rounded border px-2 py-0.5 text-xs" :class="approvalClass(h.approvalStatus)">
                  {{ APPROVAL_LABEL[h.approvalStatus] }}
                </span>
              </td>
              <td class="py-2">{{ orDash(h.reason) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ConfirmDialog
      :open="dialog === 'deactivate'"
      icon="alert-triangle"
      danger
      title="Nonaktifkan Akun Pegawai?"
      message="Pegawai tidak akan bisa login. Data kepegawaian dan riwayatnya tetap tersimpan."
      confirm-label="Ya, Nonaktifkan"
      @close="dialog = null"
      @confirm="confirmAccount"
    />
    <ConfirmDialog
      :open="dialog === 'activate'"
      icon="user-check"
      title="Aktifkan Kembali Akun Pegawai"
      message="Pegawai akan bisa login kembali. Data kepegawaian tetap tersimpan."
      confirm-label="Ya, Aktifkan"
      @close="dialog = null"
      @confirm="confirmAccount"
    />

    <FormModal :open="statusModal" title="Ubah Status Kepegawaian" submit-label="Simpan" @close="statusModal = false" @submit="submitStatus">
      <FormField label="Status Baru" for-id="st-new" required select :error="errors.newStatusId">
        <select id="st-new" v-model="form.newStatusId" class="select" :aria-invalid="!!errors.newStatusId">
          <option value="" disabled>Pilih status</option>
          <option v-for="s in statusOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </FormField>
      <FormField label="Tanggal Efektif" for-id="st-from" required :error="errors.effectiveFrom">
        <input id="st-from" v-model="form.effectiveFrom" type="date" class="input" :aria-invalid="!!errors.effectiveFrom" />
      </FormField>
      <FormField label="Nomor SK (opsional)" for-id="st-sk">
        <input id="st-sk" v-model="form.decreeNumber" class="input" placeholder="Masukkan nomor SK" />
      </FormField>
      <FormField label="Tanggal SK (opsional)" for-id="st-sk-date">
        <input id="st-sk-date" v-model="form.decreeDate" type="date" class="input" />
      </FormField>
      <div class="sm:col-span-2">
        <FormField label="Alasan Perubahan" for-id="st-reason" required :error="errors.reason">
          <textarea id="st-reason" v-model="form.reason" rows="3" class="input" :aria-invalid="!!errors.reason" />
        </FormField>
      </div>
    </FormModal>
  </section>
</template>
