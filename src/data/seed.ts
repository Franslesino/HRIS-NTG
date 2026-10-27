import type { Employee, EmployeeDetail, EmployeeStatus, EmploymentType } from '@/types/employee'
import { uid } from '@/utils/id'

export const DEPARTMENTS = [
  'Teknologi Informasi',
  'Keuangan',
  'Operasional',
  'Marketing',
  'Sumber Daya Manusia',
]
export const STATUSES: EmployeeStatus[] = ['Aktif', 'Cuti', 'Nonaktif']
export const TYPES: EmploymentType[] = ['Karyawan Tetap', 'Kontrak', 'Magang']

const seed: Employee[] = [
  { id: 'EMP-2019-0042', name: 'Rina Wulandari', department: 'Teknologi Informasi', position: 'Business Analyst', type: 'Karyawan Tetap', status: 'Aktif' },
  { id: 'EMP-2022-0120', name: 'Budi Hartono', department: 'Keuangan', position: 'Kepala Unit Kas', type: 'Karyawan Tetap', status: 'Cuti' },
  { id: 'EMP-2023-0231', name: 'Siti Aminah', department: 'Operasional', position: 'Analis Inventaris', type: 'Kontrak', status: 'Aktif' },
  { id: 'EMP-2023-0014', name: 'Zulvan Ramadhan', department: 'Teknologi Informasi', position: 'Seksi Sistem HR', type: 'Karyawan Tetap', status: 'Aktif' },
  { id: 'EMP-2023-0085', name: 'Diana Putri', department: 'Operasional', position: 'Supervisor Utama', type: 'Karyawan Tetap', status: 'Aktif' },
  { id: 'EMP-2024-0412', name: 'Rizky Pratama', department: 'Marketing', position: 'Spesialis Konten', type: 'Magang', status: 'Nonaktif' },
]

const names = [
  'Andi Saputra', 'Maya Anggraini', 'Fajar Nugroho', 'Dewi Lestari', 'Hendra Wijaya',
  'Lestari Handayani', 'Agus Setiawan', 'Putri Maharani', 'Bayu Prakoso', 'Intan Permata',
  'Yoga Firmansyah', 'Nurul Hidayah', 'Dimas Anggara', 'Ayu Kartika', 'Eko Prasetyo',
  'Fitri Rahmawati', 'Galih Pangestu', 'Hana Safitri', 'Irfan Hakim', 'Jihan Aulia',
  'Kevin Santoso', 'Laras Ayuningtyas', 'Mulyadi Kusuma', 'Novi Susanti', 'Oki Firdaus',
  'Prita Wulandari', 'Qori Ramadhani', 'Reza Mahendra', 'Sari Indrawati', 'Taufik Hidayat',
  'Umi Kalsum', 'Vina Oktaviani', 'Wahyu Utomo', 'Yusuf Maulana', 'Zahra Nabila',
  'Arif Budiman', 'Bella Cahyani', 'Candra Kirana', 'Deni Kurniawan', 'Elisa Marlina',
  'Fikri Alamsyah',
]
const positions: Record<string, string[]> = {
  'Teknologi Informasi': ['Frontend Developer', 'Backend Developer', 'QA Engineer', 'Administrator Jaringan'],
  Keuangan: ['Akuntan', 'Staf Pajak', 'Analis Anggaran', 'Kasir'],
  Operasional: ['Staf Gudang', 'Koordinator Logistik', 'Analis Proses', 'Staf Pengadaan'],
  Marketing: ['Desainer Grafis', 'Social Media Specialist', 'Account Executive', 'Staf Riset Pasar'],
  'Sumber Daya Manusia': ['Staf Rekrutmen', 'Staf Payroll', 'Spesialis Pelatihan', 'Staf Administrasi HR'],
}

const generated: Employee[] = names.map((name, i) => {
  const department = DEPARTMENTS[i % DEPARTMENTS.length]
  const list = positions[department]
  return {
    id: `EMP-${2020 + (i % 5)}-${String(100 + i * 7).padStart(4, '0')}`,
    name,
    department,
    position: list[i % list.length],
    type: i % 7 === 0 ? 'Magang' : i % 3 === 0 ? 'Kontrak' : 'Karyawan Tetap',
    status: i % 9 === 0 ? 'Nonaktif' : i % 5 === 0 ? 'Cuti' : 'Aktif',
  }
})

const summaries: Employee[] = [...seed, ...generated]


export const POSITIONS = [...new Set(summaries.map((e) => e.position))].sort((a, b) =>
  a.localeCompare(b, 'id'),
)

function toDetail(e: Employee, i: number): EmployeeDetail {
  const joinYear = Number(e.id.split('-')[1]) || 2022
  const slug = e.name.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.')
  const joinDate = `${joinYear}-0${(i % 9) + 1}-10`
  return {
    ...e,
    nik: `3273${920000000001 + i * 1237}`,
    nip: '', npwp: '',
    birthPlace: 'Bandung',
    birthDate: `199${i % 10}-0${(i % 9) + 1}-1${i % 9}`,
    gender: i % 2 === 0 ? 'Laki-laki' : 'Perempuan',
    maritalStatus: i % 3 === 0 ? 'Menikah' : 'Belum Menikah',
    childCount: 0, religion: 'Islam', bloodType: '',
    frontTitle: '', backTitle: '',
    email: `${slug}@bmis.id`,
    phone: `0812 3456 ${1000 + i}`,
    street: `Jl. Merdeka No. ${i + 1}`,
    rt: '004', rw: '010',
    village: 'Kelurahan Setiabudi', district: 'Kecamatan Setiabudi',
    city: 'Kota Bandung', province: 'Jawa Barat', postalCode: '40154',
    division: `Divisi ${e.department}`, office: 'Kantor Pusat Bandung', supervisor: 'Lucia Maria',
    joinDate, photo: '',
    jobHistory: [
      { id: uid(), position: e.position, unit: `Divisi ${e.department}`, startDate: joinDate, endDate: '', skNumber: `001/HRD/SK/${joinYear}` },
    ],
    educations: [
      { id: uid(), level: 'S1', institution: 'Universitas Padjadjaran', major: 'Ilmu Komputer', startYear: String(joinYear - 5), endYear: String(joinYear - 1), diplomaNumber: `${100 + i}/UNPAD/S1/${joinYear - 1}` },
    ],
    family: [],
    banks: [],
  }
}

/** Data awal: Rina Wulandari punya data lengkap di semua tab; pegawai lain sengaja sebagian kosong
 *  agar tampilan "Belum ada data" bisa dicoba. */
export function buildSeedDetails(): EmployeeDetail[] {
  const list = summaries.map(toDetail)
  Object.assign(list[0], {
    backTitle: 'S.Kom.', nip: '198201142009012001', nik: '3272011408920001',
    npwp: '91.327.2011.4-892.000', birthDate: '1992-01-14', gender: 'Perempuan',
    bloodType: 'O', maritalStatus: 'Menikah', childCount: 2,
    email: 'rina.wulandari@bmis.id', phone: '+62 812 3456 7890',
    street: 'Jl. Raya Kuningan Barat No. 8', joinDate: '2022-08-01',
    jobHistory: [
      { id: uid(), position: 'Business Analyst', unit: 'Divisi Teknologi Informasi', startDate: '2022-08-01', endDate: '', skNumber: '045/HRD/SK/2022' },
      { id: uid(), position: 'Associate Business Analyst', unit: 'Seksi Rekayasa Sistem', startDate: '2020-05-15', endDate: '2022-07-31', skNumber: '012/HRD/SK/2020' },
      { id: uid(), position: 'Junior Programmer', unit: 'Seksi Aplikasi TI', startDate: '2019-03-01', endDate: '2020-05-14', skNumber: '002/HRD/SK/2019' },
    ],
    educations: [
      { id: uid(), level: 'S2', institution: 'Universitas Indonesia', major: 'Teknologi Informasi', startYear: '2020', endYear: '2022', diplomaNumber: '9982/UI-MTI/2022' },
      { id: uid(), level: 'S1', institution: 'Binus University', major: 'Teknik Informatika', startYear: '2014', endYear: '2018', diplomaNumber: '1104/BINUS-TI/2018' },
    ],
    family: [
      { id: uid(), relation: 'Suami', name: 'Andi Wijaya, M.B.A.', nik: '3174092211880003', birthDate: '1988-11-22', occupation: 'Software Engineer', dependent: false },
      { id: uid(), relation: 'Anak Pertama', name: 'Rafi Al-Fatih', nik: '3174091508180001', birthDate: '2018-08-15', occupation: 'Pelajar', dependent: true },
      { id: uid(), relation: 'Anak Kedua', name: 'Siti Humaira', nik: '3174091012210002', birthDate: '2021-12-10', occupation: 'Belum Bekerja', dependent: true },
    ],
    banks: [
      { id: uid(), bank: 'Bank Mandiri', accountNumber: '1370012345678', ownerName: 'Rina Wulandari', primary: true },
      { id: uid(), bank: 'Bank BCA', accountNumber: '5220123454109', ownerName: 'Rina Wulandari', primary: false },
    ],
  } satisfies Partial<EmployeeDetail>)
  return list
}
