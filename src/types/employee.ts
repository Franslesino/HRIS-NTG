/* =====================================================================
 * Tipe data frontend — mengikuti DB_REV_3_0 (schema authorize + master).
 * Nilai enum sama persis dengan enum di database (huruf kapital).
 * ===================================================================== */

export type Gender = 'MALE' | 'FEMALE'
export type BloodType = 'A' | 'B' | 'AB' | 'O'
export type MaritalStatus = 'NEVER_MARRIED' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'
export type FamilyRelationship = 'FATHER' | 'MOTHER' | 'HUSBAND' | 'WIFE' | 'CHILD' | 'SIBLING'
export type UserStatus = 'INVITED' | 'ACTIVE' | 'LOCKED' | 'DISABLED'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/* ---------------- Data referensi (schema master) ---------------- */
export interface RefItem { id: string; code: string; name: string }
export interface EmploymentStatusRef extends RefItem { isTerminal: boolean }
export interface EducationLevelRef extends RefItem { sortOrder: number }
export interface OrganizationUnitRef extends RefItem { parentUnitId: string | null }
export interface PositionRef extends RefItem { organizationUnitId: string }
export interface CityRef extends RefItem { provinceId: string }
export interface DistrictRef extends RefItem { cityId: string }
export interface VillageRef extends RefItem { districtId: string; postalCode: string }

export interface References {
  religions: RefItem[]
  employmentTypes: RefItem[]
  employmentStatuses: EmploymentStatusRef[]
  educationLevels: EducationLevelRef[]
  banks: RefItem[]
  identifierTypes: RefItem[]
  organizationUnits: OrganizationUnitRef[]
  positions: PositionRef[]
  offices: RefItem[]
  provinces: RefItem[]
}

/** Opsi pemilih pegawai (mis. atasan langsung) */
export interface EmployeeOption { id: string; employeeNumber: string; fullName: string }

/* ---------------- Daftar pegawai ---------------- */
export interface EmployeeListItem {
  id: string
  employeeNumber: string
  fullName: string
  unitName: string
  positionName: string
  employmentType: RefItem
  employmentStatus: EmploymentStatusRef
}

/** '' pada unitId/statusId/typeId = semua */
export interface EmployeeQuery {
  search: string
  unitId: string
  statusId: string
  typeId: string
  page: number
  pageSize: number
}

export interface EmployeePage { data: EmployeeListItem[]; total: number }

/* ---------------- Detail pegawai (read model) ---------------- */
export interface Person {
  id: string
  frontTitle: string
  fullName: string
  backTitle: string
  birthDate: string // ISO yyyy-mm-dd, '' = kosong
  gender: Gender | ''
  bloodType: BloodType | ''
  maritalStatus: MaritalStatus | ''
  phoneNumber: string
  personalEmail: string
  religion: RefItem | null
  addressLine: string
  province: RefItem | null
  city: RefItem | null
  district: RefItem | null
  village: (RefItem & { postalCode: string }) | null
}

/** Identitas sensitif: backend hanya mengembalikan 4 digit terakhir (identifier_last4) */
export interface PersonIdentifier { id: string; typeCode: string; typeName: string; last4: string }

export interface Assignment {
  id: string
  positionId: string
  positionName: string
  unitName: string
  parentUnitName: string // '' jika unit tingkat atas
  officeId: string
  officeName: string
  reportsToEmployeeId: string
  reportsToName: string
  validFrom: string
  validTo: string // '' = masih berlaku
  isPrimary: boolean
  note: string
}

export interface StatusHistory {
  id: string
  previousStatusName: string
  newStatusName: string
  changeType: string
  effectiveFrom: string
  approvalStatus: ApprovalStatus
  decreeNumber: string
  decreeDate: string
  reason: string
}

export interface WorkHistory {
  id: string
  employerName: string
  positionName: string
  startDate: string
  endDate: string
  description: string
}

export interface Education {
  id: string
  educationLevelId: string
  educationLevelName: string
  institutionName: string
  fieldOfStudy: string
  graduationYear: number | null
  isHighest: boolean
}

export interface FamilyMember {
  id: string
  relationshipType: FamilyRelationship
  gender: Gender | ''
  fullName: string
  birthDate: string
  phoneNumber: string
  isDependent: boolean
}

/** Nomor rekening penuh tidak pernah dikembalikan — hanya 4 digit terakhir */
export interface BankAccount {
  id: string
  bankId: string
  bankName: string
  accountNumberLast4: string
  accountHolderName: string
  isPrimary: boolean
  isActive: boolean
}

export interface EmployeeDetail {
  id: string
  employeeNumber: string
  person: Person
  workEmail: string
  workPhone: string
  startDate: string
  endDate: string
  employmentType: RefItem
  employmentStatus: EmploymentStatusRef
  /** authorize.users.status; null = pegawai belum punya akun */
  accountStatus: UserStatus | null
  identifiers: PersonIdentifier[]
  assignments: Assignment[]
  statusHistories: StatusHistory[]
  workHistories: WorkHistory[]
  educations: Education[]
  family: FamilyMember[]
  banks: BankAccount[]
}

/* ---------------- Input (write model) ---------------- */
/** Form tambah/edit pegawai. Select belum dipilih = ''. */
export interface EmployeeForm {
  // master.people
  frontTitle: string
  fullName: string
  backTitle: string
  birthDate: string
  gender: Gender | ''
  bloodType: BloodType | ''
  maritalStatus: MaritalStatus | ''
  religionId: string
  phoneNumber: string
  personalEmail: string
  addressLine: string
  provinceId: string
  cityId: string
  districtId: string
  villageId: string
  // master.person_identifiers — saat edit, kosong = tidak diubah
  nik: string
  npwp: string
  nip: string
  // master.employees
  employeeNumber: string
  workEmail: string
  workPhone: string
  startDate: string
  employmentTypeId: string
  employmentStatusId: string
  // master.employment_assignments (penempatan utama)
  positionId: string
  officeId: string
  reportsToEmployeeId: string
}

export interface AssignmentInput {
  positionId: string
  officeId: string
  reportsToEmployeeId: string
  validFrom: string
  validTo: string
  isPrimary: boolean
  note: string
}
export interface WorkHistoryInput {
  employerName: string
  positionName: string
  startDate: string
  endDate: string
  description: string
}
export interface EducationInput {
  educationLevelId: string
  institutionName: string
  fieldOfStudy: string
  graduationYear: string
  isHighest: boolean
}
export interface FamilyInput {
  relationshipType: FamilyRelationship | ''
  gender: Gender | ''
  fullName: string
  birthDate: string
  phoneNumber: string
  isDependent: boolean
}
/** accountNumber kosong saat edit = tidak diubah */
export interface BankInput {
  bankId: string
  accountNumber: string
  accountHolderName: string
  isPrimary: boolean
}
export interface StatusChangeInput {
  newStatusId: string
  effectiveFrom: string
  decreeNumber: string
  decreeDate: string
  reason: string
}
