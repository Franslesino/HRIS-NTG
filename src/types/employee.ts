export type EmployeeStatus = 'Aktif' | 'Cuti' | 'Nonaktif'
export type EmploymentType = 'Karyawan Tetap' | 'Kontrak' | 'Magang'
export type Gender = 'Laki-laki' | 'Perempuan'
export type EducationLevel = 'SMA' | 'D3' | 'S1' | 'S2' | 'S3'

export interface JobHistory {
  id: string
  position: string
  unit: string
  startDate: string // ISO yyyy-mm-dd
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

/** Profil lengkap milik pegawai yang sedang login */
export interface EmployeeDetail {
  id: string
  name: string
  department: string
  position: string
  type: EmploymentType
  status: EmployeeStatus
  nik: string
  nip: string
  npwp: string
  birthPlace: string
  birthDate: string
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
  domicile: string
  division: string
  office: string
  supervisor: string
  joinDate: string
  photo: string
  jobHistory: JobHistory[]
  educations: Education[]
  family: FamilyMember[]
  banks: BankAccount[]
}
