import type { RefItem } from './employee'

/* Tipe data modul Organisasi & Jabatan — mengikuti master.organization_units, positions, offices, *_types */

export type TypeKind = 'UNIT' | 'OFFICE' | 'POSITION'

export interface TypeItem {
  id: string
  code: string
  name: string
  description: string
  isActive: boolean
  usageCount: number
}
export interface TypeInput { code: string; name: string; description: string; isActive: boolean }

export interface OrgUnit {
  id: string
  parentUnitId: string | null
  unitTypeId: string
  unitTypeName: string
  code: string
  name: string
  description: string
  isActive: boolean
  childCount: number
  positionCount: number
}
/** parentUnitId '' = unit tingkat atas */
export interface OrgUnitInput {
  parentUnitId: string
  unitTypeId: string
  code: string
  name: string
  description: string
  isActive: boolean
}

export interface Position {
  id: string
  organizationUnitId: string
  unitName: string
  code: string
  name: string
  positionTypeId: string
  positionTypeName: string
  parentPositionId: string
  parentPositionName: string
  echelonId: string
  echelonName: string
  allowsMultipleHolders: boolean
  levelLabel: string
  description: string
  isActive: boolean
  holderCount: number
}
export interface PositionInput {
  organizationUnitId: string
  code: string
  name: string
  positionTypeId: string
  parentPositionId: string
  echelonId: string
  allowsMultipleHolders: boolean
  levelLabel: string
  description: string
  isActive: boolean
}
export interface PositionHolder { employeeId: string; employeeNumber: string; fullName: string; validFrom: string }

export interface Office {
  id: string
  officeTypeId: string
  officeTypeName: string
  parentOfficeId: string
  parentOfficeName: string
  code: string
  name: string
  addressLine: string
  provinceId: string
  cityId: string
  districtId: string
  villageId: string
  provinceName: string
  cityName: string
  districtName: string
  villageName: string
  phoneNumber: string
  isActive: boolean
  employeeCount: number
}
export interface OfficeInput {
  officeTypeId: string
  parentOfficeId: string
  code: string
  name: string
  addressLine: string
  provinceId: string
  cityId: string
  districtId: string
  villageId: string
  phoneNumber: string
  isActive: boolean
}

/** Pilihan dropdown untuk form organisasi (hanya yang aktif) */
export interface OrgReferences {
  unitTypes: RefItem[]
  officeTypes: RefItem[]
  positionTypes: RefItem[]
  echelons: RefItem[]
}

/** Node pohon unit (dibangun di frontend dari daftar datar) */
export interface UnitNode extends OrgUnit { children: UnitNode[] }
