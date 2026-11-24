/**
 * Data mock untuk pengembangan frontend — BUKAN data nyata.
 * Bentuknya meniru tabel DB_REV_3_0 (uuid, enum, FK) supaya perpindahan ke backend minim perubahan.
 * Nilai master (status, jenis, wilayah, unit) hanya contoh; isi sebenarnya mengikuti seed database.
 */
import type {
  BloodType, CityRef, DistrictRef, EmploymentStatusRef, FamilyRelationship, Gender, MaritalStatus,
  OrganizationUnitRef, PositionRef, RefItem, References, UserStatus, VillageRef, ApprovalStatus,
  EducationLevelRef,
} from '@/types/employee'
import { seedId } from '@/utils/id'

/* ---------------- Baris tabel (bentuk "database") ---------------- */
export interface PersonRow {
  id: string; frontTitle: string; fullName: string; backTitle: string; birthDate: string
  gender: Gender | ''; bloodType: BloodType | ''; maritalStatus: MaritalStatus | ''
  phoneNumber: string; personalEmail: string; religionId: string; addressLine: string
  provinceId: string; cityId: string; districtId: string; villageId: string
}
export interface EmployeeRow {
  id: string; personId: string; employeeNumber: string; employmentTypeId: string
  employmentStatusId: string; startDate: string; endDate: string; workEmail: string
  workPhone: string; accountStatus: UserStatus | null
}
export interface IdentifierRow { id: string; personId: string; typeId: string; last4: string }
export interface AssignmentRow {
  id: string; employeeId: string; positionId: string; officeId: string; reportsToEmployeeId: string
  validFrom: string; validTo: string; isPrimary: boolean; note: string
}
export interface StatusHistoryRow {
  id: string; employeeId: string; previousStatusId: string; newStatusId: string; changeType: string
  effectiveFrom: string; approvalStatus: ApprovalStatus; decreeNumber: string; decreeDate: string; reason: string
}
export interface WorkHistoryRow {
  id: string; personId: string; employerName: string; positionName: string
  startDate: string; endDate: string; description: string
}
export interface EducationRow {
  id: string; personId: string; educationLevelId: string; institutionName: string
  fieldOfStudy: string; graduationYear: number | null; isHighest: boolean
}
export interface FamilyRow {
  id: string; personId: string; relationshipType: FamilyRelationship; gender: Gender | ''
  fullName: string; birthDate: string; phoneNumber: string; isDependent: boolean
}
export interface BankRow {
  id: string; employeeId: string; bankId: string; last4: string; holderName: string
  isPrimary: boolean; isActive: boolean
}

export interface TypeRow { id: string; code: string; name: string; description: string; isActive: boolean; deleted: boolean }
export interface UnitRow extends OrganizationUnitRef {
  unitTypeId: string; description: string; isActive: boolean; deleted: boolean
}
export interface PositionRow extends PositionRef {
  positionTypeId: string; parentPositionId: string; echelonId: string; allowsMultipleHolders: boolean
  levelLabel: string; description: string; isActive: boolean; deleted: boolean
}
export interface OfficeRow extends RefItem {
  officeTypeId: string; parentOfficeId: string; addressLine: string
  provinceId: string; cityId: string; districtId: string; villageId: string
  phoneNumber: string; isActive: boolean; deleted: boolean
}

export interface MockDb {
  refs: References
  units: UnitRow[]
  positionRows: PositionRow[]
  officeRows: OfficeRow[]
  unitTypes: TypeRow[]
  officeTypes: TypeRow[]
  positionTypes: TypeRow[]
  echelons: RefItem[]
  cities: CityRef[]
  districts: DistrictRef[]
  villages: VillageRef[]
  people: PersonRow[]
  employees: EmployeeRow[]
  identifiers: IdentifierRow[]
  assignments: AssignmentRow[]
  statusHistories: StatusHistoryRow[]
  workHistories: WorkHistoryRow[]
  educations: EducationRow[]
  family: FamilyRow[]
  banks: BankRow[]
}

const mk = (ns: number, rows: [string, string][]): RefItem[] =>
  rows.map(([code, name], i) => ({ id: seedId(ns, i + 1), code, name }))

export function buildMockDb(): MockDb {
  /* ---------- referensi ---------- */
  const religions = mk(1, [
    ['ISLAM', 'Islam'], ['KRISTEN', 'Kristen'], ['KATOLIK', 'Katolik'],
    ['HINDU', 'Hindu'], ['BUDDHA', 'Buddha'], ['KONGHUCU', 'Konghucu'],
  ])
  const employmentTypes = mk(2, [['PERMANENT', 'Karyawan Tetap'], ['CONTRACT', 'Kontrak'], ['INTERN', 'Magang']])
  const statusDefs: [string, string, boolean][] = [
    ['ACTIVE', 'Aktif', false], ['PROBATION', 'Masa Percobaan', false],
    ['RESIGNED', 'Mengundurkan Diri', true], ['TERMINATED', 'Diberhentikan', true],
  ]
  const employmentStatuses: EmploymentStatusRef[] = statusDefs.map(([code, name, isTerminal], i) => ({
    id: seedId(3, i + 1), code, name, isTerminal,
  }))
  const educationLevels: EducationLevelRef[] = (
    [['SMA', 'SMA/SMK'], ['D3', 'Diploma (D3)'], ['S1', 'Sarjana (S1)'], ['S2', 'Magister (S2)'], ['S3', 'Doktor (S3)']] as [string, string][]
  ).map(([code, name], i) => ({ id: seedId(4, i + 1), code, name, sortOrder: i + 1 }))
  const banks = mk(5, [
    ['MANDIRI', 'Bank Mandiri'], ['BCA', 'Bank BCA'], ['BNI', 'Bank BNI'], ['BRI', 'Bank BRI'],
    ['BSI', 'Bank Syariah Indonesia'], ['CIMB', 'Bank CIMB Niaga'], ['PERMATA', 'Bank Permata'],
  ])
  const identifierTypes = mk(6, [['NIK', 'NIK'], ['NPWP', 'NPWP'], ['NIP', 'NIP']])

  const unitDefs: [string, string, number | null][] = [
    ['TI', 'Teknologi Informasi', null], ['KEU', 'Keuangan', null], ['OPS', 'Operasional', null],
    ['MKT', 'Marketing', null], ['SDM', 'Sumber Daya Manusia', null],
    ['TI-APP', 'Divisi Pengembangan Aplikasi', 0], ['TI-INF', 'Divisi Infrastruktur', 0],
    ['SDM-REK', 'Divisi Rekrutmen', 4],
  ]
  const typeRows = (ns: number, rows: [string, string, string][]): TypeRow[] =>
    rows.map(([code, name, description], i) => ({ id: seedId(ns, i + 1), code, name, description, isActive: true, deleted: false }))
  const unitTypes = typeRows(14, [
    ['DIREKTORAT', 'Direktorat', 'Unit tingkat tertinggi'], ['DEPARTEMEN', 'Departemen', 'Unit tingkat departemen'],
    ['DIVISI', 'Divisi', 'Unit di bawah departemen'], ['TIM', 'Tim', 'Kelompok kerja'],
  ])
  const unitTypeId = (code: string) => unitTypes.find((t) => t.code === code)!.id
  const organizationUnits: UnitRow[] = unitDefs.map(([code, name, parent], i) => ({
    id: seedId(7, i + 1), code, name, parentUnitId: parent === null ? null : seedId(7, parent + 1),
    unitTypeId: unitTypeId(parent === null ? 'DEPARTEMEN' : 'DIVISI'), description: '', isActive: true, deleted: false,
  }))
  const unitByCode = (code: string) => organizationUnits.find((u) => u.code === code)!

  const positionDefs: [string, string][] = [
    ['TI-APP', 'Frontend Developer'], ['TI-APP', 'Backend Developer'], ['TI-APP', 'QA Engineer'],
    ['TI-INF', 'Administrator Jaringan'], ['TI', 'Business Analyst'], ['TI', 'Associate Business Analyst'],
    ['TI', 'Junior Programmer'], ['TI', 'Seksi Sistem HR'],
    ['KEU', 'Akuntan'], ['KEU', 'Staf Pajak'], ['KEU', 'Analis Anggaran'], ['KEU', 'Kasir'], ['KEU', 'Kepala Unit Kas'],
    ['OPS', 'Staf Gudang'], ['OPS', 'Koordinator Logistik'], ['OPS', 'Analis Proses'],
    ['OPS', 'Staf Pengadaan'], ['OPS', 'Analis Inventaris'], ['OPS', 'Supervisor Utama'],
    ['MKT', 'Desainer Grafis'], ['MKT', 'Social Media Specialist'], ['MKT', 'Account Executive'],
    ['MKT', 'Staf Riset Pasar'], ['MKT', 'Spesialis Konten'],
    ['SDM', 'Kepala Departemen SDM'], ['SDM', 'Staf Payroll'], ['SDM', 'Spesialis Pelatihan'],
    ['SDM', 'Staf Administrasi HR'], ['SDM-REK', 'Staf Rekrutmen'],
  ]
  const positionTypes = typeRows(16, [
    ['STRUKTURAL', 'Struktural', 'Jabatan pimpinan unit'], ['FUNGSIONAL', 'Fungsional', 'Jabatan keahlian/profesi'],
    ['PELAKSANA', 'Pelaksana', 'Jabatan pelaksana/staf'],
  ])
  const positionTypeFor = (name: string) =>
    positionTypes.find((t) => t.code === (/^(Kepala|Supervisor)/.test(name) ? 'STRUKTURAL'
      : /(Analis|Developer|Engineer|Business Analyst|Specialist|Spesialis|Akuntan|Desainer|Account)/.test(name) ? 'FUNGSIONAL'
      : 'PELAKSANA'))!.id
  const echelons: RefItem[] = mk(15, [['II.A', 'Eselon II.a'], ['II.B', 'Eselon II.b'], ['III.A', 'Eselon III.a'], ['III.B', 'Eselon III.b'], ['IV.A', 'Eselon IV.a']])
  const positions: PositionRow[] = positionDefs.map(([unitCode, name], i) => ({
    id: seedId(8, i + 1), code: `POS-${String(i + 1).padStart(3, '0')}`, name,
    organizationUnitId: unitByCode(unitCode).id,
    positionTypeId: positionTypeFor(name), parentPositionId: '', echelonId: '',
    allowsMultipleHolders: name !== 'Kepala Departemen SDM', levelLabel: '', description: '', isActive: true, deleted: false,
  }))
  const positionByName = (name: string) => positions.find((p) => p.name === name)!
  const topUnitId = (unitId: string): string => {
    const u = organizationUnits.find((x) => x.id === unitId)!
    return u.parentUnitId ? topUnitId(u.parentUnitId) : u.id
  }

  const officeTypes = typeRows(17, [['PUSAT', 'Kantor Pusat', 'Kantor induk organisasi'], ['CABANG', 'Kantor Cabang', 'Kantor di bawah kantor pusat']])

  const provinces = mk(10, [['32', 'Jawa Barat'], ['31', 'DKI Jakarta']])
  const cityDefs: [string, string, number][] = [
    ['3273', 'Kota Bandung', 0], ['3275', 'Kota Bekasi', 0],
    ['3174', 'Kota Jakarta Selatan', 1], ['3173', 'Kota Jakarta Pusat', 1],
  ]
  const cities: CityRef[] = cityDefs.map(([code, name, p], i) => ({
    id: seedId(11, i + 1), code, name, provinceId: provinces[p].id,
  }))
  const districtDefs: [string, string, number][] = [
    ['327309', 'Coblong', 0], ['327306', 'Cicendo', 0], ['327505', 'Bekasi Barat', 1],
    ['317406', 'Setiabudi', 2], ['317404', 'Kebayoran Baru', 2], ['317301', 'Menteng', 3],
  ]
  const districts: DistrictRef[] = districtDefs.map(([code, name, c], i) => ({
    id: seedId(12, i + 1), code, name, cityId: cities[c].id,
  }))
  const villageDefs: [string, string, number, string][] = [
    ['3273091001', 'Dago', 0, '40135'], ['3273091002', 'Lebak Siliwangi', 0, '40132'],
    ['3273061001', 'Pasteur', 1, '40161'], ['3273061002', 'Pajajaran', 1, '40173'],
    ['3275051001', 'Bintara', 2, '17136'], ['3275051002', 'Kranji', 2, '17135'],
    ['3174061001', 'Setiabudi', 3, '12910'], ['3174061002', 'Karet Kuningan', 3, '12940'],
    ['3174041001', 'Senayan', 4, '10270'], ['3174041002', 'Selong', 4, '12110'],
    ['3173011001', 'Menteng', 5, '10310'], ['3173011002', 'Gondangdia', 5, '10350'],
  ]
  const villages: VillageRef[] = villageDefs.map(([code, name, d, postalCode], i) => ({
    id: seedId(13, i + 1), code, name, districtId: districts[d].id, postalCode,
  }))
  const regionOf = (villageIdx: number) => {
    const v = villages[villageIdx % villages.length]
    const d = districts.find((x) => x.id === v.districtId)!
    const c = cities.find((x) => x.id === d.cityId)!
    return { villageId: v.id, districtId: d.id, cityId: c.id, provinceId: c.provinceId }
  }

  const officeRow = (n: number, code: string, name: string, type: string, parent: string, address: string, village: number, phone: string): OfficeRow => ({
    id: seedId(9, n), code, name, officeTypeId: officeTypes.find((t) => t.code === type)!.id, parentOfficeId: parent,
    addressLine: address, ...regionOf(village), phoneNumber: phone, isActive: true, deleted: false,
  })
  const offices: OfficeRow[] = [
    officeRow(1, 'KP-BDG', 'Kantor Pusat Bandung', 'PUSAT', '', 'Jl. Ir. H. Juanda No. 100', 0, '022 1234 5678'),
    officeRow(2, 'KC-JKT', 'Kantor Cabang Jakarta', 'CABANG', seedId(9, 1), 'Jl. H.R. Rasuna Said Kav. 1', 7, '021 8765 4321'),
  ]

  const refs: References = {
    religions, employmentTypes, employmentStatuses, educationLevels, banks, identifierTypes,
    organizationUnits, positions, offices, provinces,
  }

  /* ---------- pegawai ---------- */
  interface Def { number: string; name: string; gender: Gender; position: string; type: string; status: string }
  const handpicked: Def[] = [
    { number: 'EMP-2019-0042', name: 'Rina Wulandari', gender: 'FEMALE', position: 'Business Analyst', type: 'PERMANENT', status: 'ACTIVE' },
    { number: 'EMP-2022-0120', name: 'Budi Hartono', gender: 'MALE', position: 'Kepala Unit Kas', type: 'PERMANENT', status: 'PROBATION' },
    { number: 'EMP-2023-0231', name: 'Siti Aminah', gender: 'FEMALE', position: 'Analis Inventaris', type: 'CONTRACT', status: 'ACTIVE' },
    { number: 'EMP-2023-0014', name: 'Zulvan Ramadhan', gender: 'MALE', position: 'Seksi Sistem HR', type: 'PERMANENT', status: 'ACTIVE' },
    { number: 'EMP-2023-0085', name: 'Diana Putri', gender: 'FEMALE', position: 'Supervisor Utama', type: 'PERMANENT', status: 'ACTIVE' },
    { number: 'EMP-2024-0412', name: 'Rizky Pratama', gender: 'MALE', position: 'Spesialis Konten', type: 'INTERN', status: 'RESIGNED' },
  ]
  const names = (
    'M:Andi Saputra,F:Maya Anggraini,M:Fajar Nugroho,F:Dewi Lestari,M:Hendra Wijaya,F:Lestari Handayani,' +
    'M:Agus Setiawan,F:Putri Maharani,M:Bayu Prakoso,F:Intan Permata,M:Yoga Firmansyah,F:Nurul Hidayah,' +
    'M:Dimas Anggara,F:Ayu Kartika,M:Eko Prasetyo,F:Fitri Rahmawati,M:Galih Pangestu,F:Hana Safitri,' +
    'M:Irfan Hakim,F:Jihan Aulia,M:Kevin Santoso,F:Laras Ayuningtyas,M:Mulyadi Kusuma,F:Novi Susanti,' +
    'M:Oki Firdaus,F:Prita Wulandari,F:Qori Ramadhani,M:Reza Mahendra,F:Sari Indrawati,M:Taufik Hidayat,' +
    'F:Umi Kalsum,F:Vina Oktaviani,M:Wahyu Utomo,M:Yusuf Maulana,F:Zahra Nabila,M:Arif Budiman,' +
    'F:Bella Cahyani,F:Candra Kirana,M:Deni Kurniawan,F:Elisa Marlina,M:Fikri Alamsyah'
  ).split(',')
  const topUnits = organizationUnits.filter((u) => !u.parentUnitId)
  const generated: Def[] = names.map((raw, i) => {
    const [g, name] = raw.split(':')
    const top = topUnits[i % topUnits.length]
    const list = positions.filter((p) => topUnitId(p.organizationUnitId) === top.id && p.name !== 'Kepala Departemen SDM')
    return {
      number: `EMP-${2020 + (i % 5)}-${String(100 + i * 7).padStart(4, '0')}`,
      name, gender: g === 'M' ? 'MALE' : 'FEMALE', position: list[i % list.length].name,
      type: i % 7 === 0 ? 'INTERN' : i % 3 === 0 ? 'CONTRACT' : 'PERMANENT',
      status: i % 9 === 0 ? 'RESIGNED' : i % 5 === 0 ? 'PROBATION' : 'ACTIVE',
    }
  })
  const head: Def = { number: 'EMP-2018-0001', name: 'Lucia Maria', gender: 'FEMALE', position: 'Kepala Departemen SDM', type: 'PERMANENT', status: 'ACTIVE' }
  const defs = [...handpicked, ...generated, head]

  const db: MockDb = {
    refs, units: organizationUnits, positionRows: positions, officeRows: offices,
    unitTypes, officeTypes, positionTypes, echelons,
    cities, districts, villages,
    people: [], employees: [], identifiers: [], assignments: [], statusHistories: [],
    workHistories: [], educations: [], family: [], banks: [],
  }
  const typeId = (code: string) => employmentTypes.find((t) => t.code === code)!.id
  const statusId = (code: string) => employmentStatuses.find((s) => s.code === code)!.id
  const identTypeId = (code: string) => identifierTypes.find((t) => t.code === code)!.id
  const levelId = (code: string) => educationLevels.find((l) => l.code === code)!.id
  const bankId = (code: string) => banks.find((b) => b.code === code)!.id
  const headEmployeeId = seedId(21, defs.length)

  defs.forEach((d, n) => {
    const isRina = n === 0
    const joinYear = isRina ? 2019 : Number(d.number.split('-')[1]) || 2022
    const startDate = isRina ? '2019-03-01' : `${joinYear}-0${(n % 9) + 1}-10`
    const slug = d.name.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.')
    const terminal = employmentStatuses.find((s) => s.code === d.status)!.isTerminal
    const personId = seedId(20, n + 1)
    const employeeId = seedId(21, n + 1)

    db.people.push({
      id: personId, frontTitle: '', fullName: d.name, backTitle: isRina ? 'S.Kom.' : '',
      birthDate: isRina ? '1992-01-14' : `199${n % 10}-0${(n % 9) + 1}-1${n % 9}`,
      gender: d.gender, bloodType: isRina ? 'O' : '',
      maritalStatus: isRina || n % 3 === 0 ? 'MARRIED' : 'NEVER_MARRIED',
      phoneNumber: isRina ? '+62 812 3456 7890' : `0812 3456 ${1000 + n}`, personalEmail: '',
      religionId: religions[0].id,
      addressLine: isRina ? 'Jl. Raya Kuningan Barat No. 8' : `Jl. Merdeka No. ${n + 1}`,
      ...regionOf(isRina ? 7 : n),
    })

    db.employees.push({
      id: employeeId, personId, employeeNumber: d.number,
      employmentTypeId: typeId(d.type), employmentStatusId: statusId(d.status),
      startDate, endDate: terminal ? '2025-12-31' : '',
      workEmail: `${slug}@bmis.id`, workPhone: '',
      accountStatus: terminal ? 'DISABLED' : n % 4 === 3 ? null : 'ACTIVE',
    })

    db.identifiers.push({ id: seedId(22, n * 3 + 1), personId, typeId: identTypeId('NIK'), last4: isRina ? '0001' : String(1000 + n * 37).slice(-4) })
    if (isRina) {
      db.identifiers.push({ id: seedId(22, n * 3 + 2), personId, typeId: identTypeId('NPWP'), last4: '0000' })
      db.identifiers.push({ id: seedId(22, n * 3 + 3), personId, typeId: identTypeId('NIP'), last4: '2001' })
    }

    const officeId = offices[n % 4 === 0 ? 1 : 0].id
    const reportsTo = employeeId === headEmployeeId ? '' : headEmployeeId
    const a = (k: number, position: string, from: string, to: string) =>
      db.assignments.push({
        id: seedId(23, n * 5 + k), employeeId, positionId: positionByName(position).id, officeId,
        reportsToEmployeeId: reportsTo, validFrom: from, validTo: to, isPrimary: true, note: '',
      })
    if (isRina) {
      a(1, 'Junior Programmer', '2019-03-01', '2020-05-14')
      a(2, 'Associate Business Analyst', '2020-05-15', '2022-07-31')
      a(3, 'Business Analyst', '2022-08-01', '')
    } else {
      a(1, d.position, startDate, terminal ? '2025-12-31' : '')
    }

    const history = (k: number, prev: string, next: string, type: string, from: string) =>
      db.statusHistories.push({
        id: seedId(24, n * 3 + k), employeeId, previousStatusId: prev, newStatusId: next,
        changeType: type, effectiveFrom: from, approvalStatus: 'APPROVED', decreeNumber: '', decreeDate: '', reason: '',
      })
    if (terminal) {
      history(1, '', statusId('ACTIVE'), 'INITIAL', startDate)
      history(2, statusId('ACTIVE'), statusId(d.status), 'SEPARATION', '2025-12-31')
    } else {
      history(1, '', statusId(d.status), 'INITIAL', startDate)
    }

    if (isRina) {
      db.educations.push(
        { id: seedId(25, 1), personId, educationLevelId: levelId('S2'), institutionName: 'Universitas Indonesia', fieldOfStudy: 'Teknologi Informasi', graduationYear: 2022, isHighest: true },
        { id: seedId(25, 2), personId, educationLevelId: levelId('S1'), institutionName: 'Binus University', fieldOfStudy: 'Teknik Informatika', graduationYear: 2018, isHighest: false },
      )
      db.family.push(
        { id: seedId(26, 1), personId, relationshipType: 'HUSBAND', gender: 'MALE', fullName: 'Andi Wijaya, M.B.A.', birthDate: '1988-11-22', phoneNumber: '', isDependent: false },
        { id: seedId(26, 2), personId, relationshipType: 'CHILD', gender: 'MALE', fullName: 'Rafi Al-Fatih', birthDate: '2018-08-15', phoneNumber: '', isDependent: true },
        { id: seedId(26, 3), personId, relationshipType: 'CHILD', gender: 'FEMALE', fullName: 'Siti Humaira', birthDate: '2021-12-10', phoneNumber: '', isDependent: true },
      )
      db.banks.push(
        { id: seedId(27, 1), employeeId, bankId: bankId('MANDIRI'), last4: '5678', holderName: 'Rina Wulandari', isPrimary: true, isActive: true },
        { id: seedId(27, 2), employeeId, bankId: bankId('BCA'), last4: '4109', holderName: 'Rina Wulandari', isPrimary: false, isActive: true },
      )
      db.workHistories.push({
        id: seedId(28, 1), personId, employerName: 'PT Solusi Digital Nusantara', positionName: 'Junior System Analyst',
        startDate: '2016-07-01', endDate: '2019-02-28', description: 'Analisis kebutuhan dan dokumentasi sistem internal.',
      })
    } else {
      db.educations.push({
        id: seedId(25, 100 + n), personId, educationLevelId: levelId('S1'), institutionName: 'Universitas Padjadjaran',
        fieldOfStudy: 'Ilmu Komputer', graduationYear: joinYear - 1, isHighest: true,
      })
    }
  })

  return db
}
