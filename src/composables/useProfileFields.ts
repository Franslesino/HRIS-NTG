import { computed } from 'vue'
import type { InfoField } from '@/components/profile/InfoCard.vue'
import type { EmployeeDetail } from '@/types/employee'
import { formatLongDate, orDash } from '@/utils/format'

/** Susunan field kartu info yang dipakai tampilan admin maupun pegawai */
export function useProfileFields(getEmployee: () => EmployeeDetail, opts: { domicile?: boolean } = {}) {
  const e = computed(getEmployee)

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
    ...(opts.domicile ? [{ label: 'Domisili', value: orDash(e.value.domicile) }] : []),
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
    { label: 'Status Akun', value: e.value.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif' },
  ])

  return { identitas, kontak, alamat, jabatan, kepegawaian }
}
