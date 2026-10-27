<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import InfoCard, { type InfoField } from './InfoCard.vue'
import { employeeStore } from '@/stores/employeeStore'
import { useToast } from '@/composables/useToast'
import { formatLongDate, orDash } from '@/utils/format'
import type { EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const { show } = useToast()
const e = computed(() => props.employee)
const isInactive = computed(() => e.value.status === 'Nonaktif')
const print = () => window.print()
const dialog = ref<'deactivate' | 'activate' | null>(null)

const identitas = computed<InfoField[]>(() => [
  { label: 'Nama Lengkap', value: e.value.name },
  { label: 'Gelar Depan', value: orDash(e.value.frontTitle) },
  { label: 'Gelar Belakang', value: orDash(e.value.backTitle) },
  { label: 'NIP', value: orDash(e.value.nip) },
  { label: 'NIK', value: orDash(e.value.nik) },
  { label: 'NPWP', value: orDash(e.value.npwp) },
  { label: 'Tempat Lahir', value: orDash(e.value.birthPlace) },
  { label: 'Tanggal Lahir', value: formatLongDate(e.value.birthDate) },
  { label: 'Jenis Kelamin', value: orDash(e.value.gender) },
  { label: 'Golongan Darah', value: orDash(e.value.bloodType) },
  { label: 'Agama', value: orDash(e.value.religion) },
  { label: 'Status Pernikahan', value: orDash(e.value.maritalStatus) },
])
const kontak = computed<InfoField[]>(() => [
  { label: 'Email', value: orDash(e.value.email) },
  { label: 'Nomor HP', value: orDash(e.value.phone) },
])
const alamat = computed<InfoField[]>(() => [
  { label: 'Alamat Jalan', value: orDash(e.value.street) },
  { label: 'RT / RW', value: e.value.rt || e.value.rw ? `${orDash(e.value.rt)} / ${orDash(e.value.rw)}` : '-' },
  { label: 'Provinsi', value: orDash(e.value.province) },
  { label: 'Kota / Kabupaten', value: orDash(e.value.city) },
  { label: 'Kecamatan', value: orDash(e.value.district) },
  { label: 'Kelurahan / Desa', value: orDash(e.value.village) },
  { label: 'Kode Pos', value: orDash(e.value.postalCode) },
])
const jabatan = computed<InfoField[]>(() => [
  { label: 'Jabatan', value: e.value.position },
  { label: 'Departemen', value: e.value.department },
  { label: 'Divisi', value: orDash(e.value.division) },
  { label: 'Kantor', value: orDash(e.value.office) },
])
const kepegawaian = computed<InfoField[]>(() => [
  { label: 'Jenis Kepegawaian', value: e.value.type },
  { label: 'Status Kepegawaian', value: e.value.status },
  { label: 'Tanggal Bergabung', value: formatLongDate(e.value.joinDate) },
  { label: 'Status Akun', value: isInactive.value ? 'Nonaktif' : 'Aktif', slot: 'account' },
])

function confirm() {
  employeeStore.setStatus(e.value.id, dialog.value === 'deactivate' ? 'Nonaktif' : 'Aktif')
  dialog.value = null
  show('Data pegawai berhasil diperbarui')
}
</script>

<template>
  <section class="rounded-xl border border-line bg-white p-6">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <h2 class="text-sm font-semibold">Data Pegawai</h2>
      <div class="flex gap-2 print:hidden">
        <button type="button" class="btn btn-primary" @click="print">
          <AppIcon name="download" :size="14" /> Export PDF
        </button>
        <button v-if="!isInactive" type="button" class="btn btn-danger-outline" @click="dialog = 'deactivate'">
          Nonaktifkan
        </button>
        <button v-else type="button" class="btn btn-brand-outline" @click="dialog = 'activate'">
          Aktifkan Kembali
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
        <InfoCard title="Jabatan & Unit Kerja" :fields="jabatan" />
      </div>
    </div>

    <InfoCard class="mt-4" title="Status Kepegawaian" :fields="kepegawaian">
      <template #account="{ value }">
        <span
          class="inline-block rounded border px-2 py-0.5 text-xs"
          :class="isInactive ? 'border-gray-300 bg-gray-50 text-ink-soft' : 'border-brand-500 bg-brand-50 text-brand-600'"
        >
          {{ value }}
        </span>
      </template>
    </InfoCard>

    <ConfirmDialog
      :open="dialog === 'deactivate'"
      icon="alert-triangle"
      danger
      title="Nonaktifkan Pegawai?"
      message="Pegawai tidak akan bisa login dan statusnya menjadi Nonaktif. Data tetap tersimpan."
      confirm-label="Ya, Nonaktifkan"
      @close="dialog = null"
      @confirm="confirm"
    />
    <ConfirmDialog
      :open="dialog === 'activate'"
      icon="user-check"
      title="Aktifkan Kembali Pegawai"
      message="Pegawai akan bisa login kembali dan statusnya menjadi Aktif. Data pegawai tetap tersimpan."
      confirm-label="Ya, Aktifkan"
      @close="dialog = null"
      @confirm="confirm"
    />
  </section>
</template>
