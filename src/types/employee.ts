export type EmployeeStatus = 'Aktif' | 'Cuti' | 'Nonaktif'
export type EmploymentType = 'Karyawan Tetap' | 'Kontrak' | 'Magang'
export type Gender = 'Laki-laki' | 'Perempuan'
export type EducationLevel = 'SMA' | 'D3' | 'S1' | 'S2' | 'S3'

/** Ringkasan untuk tabel daftar pegawai */
export interface Employee {
  id: string
  name: string
  department: string
  position: string
  type: EmploymentType
  status: EmployeeStatus
}

export interface EmployeeQuery {
  search: string
  department: string
  status: string
  type: string
  page: number
  pageSize: number
}

export interface EmployeePage {
  data: Employee[]
  total: number
}

export interface EmployeeProfile {
  nik: string
  nip: string
  npwp: string
  birthPlace: string
  birthDate: string // ISO yyyy-mm-dd
  gender: Gender | ''
  maritalStatus: string
  childCount: number
  religion: string
  bloodType: string
  frontTitle: string
  backTitle: string
  email: string
  phone: string
  street: string
  rt: string
  rw: string
  village: string
  district: string
  city: string
  province: string
  postalCode: string
  division: string
  office: string
  supervisor: string
  joinDate: string // ISO
}

export interface JobHistory {
  id: string
  position: string
  unit: string
  startDate: string
  endDate: string // kosong = masih menjabat
  skNumber: string
}

export interface Education {
  id: string
  level: EducationLevel
  institution: string
  major: string
  startYear: string
  endYear: string
  diplomaNumber: string
}

export interface FamilyMember {
  id: string
  relation: string
  name: string
  nik: string
  birthDate: string
  occupation: string
  dependent: boolean
}

export interface BankAccount {
  id: string
  bank: string
  accountNumber: string
  ownerName: string
  primary: boolean
}

export interface EmployeeDetail extends Employee, EmployeeProfile {
  photo: string
  jobHistory: JobHistory[]
  educations: Education[]
  family: FamilyMember[]
  banks: BankAccount[]
}

export type RecordKey = 'jobHistory' | 'educations' | 'family' | 'banks'
export interface RecordMap {
  jobHistory: JobHistory
  educations: Education
  family: FamilyMember
  banks: BankAccount
}

/** Nilai form: select yang belum dipilih bernilai string kosong */
export interface EmployeeForm
  extends Omit<Employee, 'type'>,
    Omit<EmployeeProfile, 'childCount'> {
  type: EmploymentType | ''
  childCount: string
  photo: string
}
