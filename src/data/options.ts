import type {
  BloodType, FamilyRelationship, Gender, MaritalStatus, UserStatus, ApprovalStatus,
} from '@/types/employee'

/** Daftar {value,label} dari peta label enum */
export function entries<K extends string>(map: Record<K, string>): { value: K; label: string }[] {
  return (Object.keys(map) as K[]).map((value) => ({ value, label: map[value] }))
}

export const GENDER_LABEL: Record<Gender, string> = { MALE: 'Laki-laki', FEMALE: 'Perempuan' }
export const MARITAL_LABEL: Record<MaritalStatus, string> = {
  NEVER_MARRIED: 'Belum Menikah', MARRIED: 'Menikah', DIVORCED: 'Cerai Hidup', WIDOWED: 'Cerai Mati',
}
export const BLOOD_TYPES: BloodType[] = ['A', 'B', 'AB', 'O']
export const RELATIONSHIP_LABEL: Record<FamilyRelationship, string> = {
  FATHER: 'Ayah', MOTHER: 'Ibu', HUSBAND: 'Suami', WIFE: 'Istri', CHILD: 'Anak', SIBLING: 'Saudara Kandung',
}
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  INVITED: 'Undangan Terkirim', ACTIVE: 'Aktif', LOCKED: 'Terkunci', DISABLED: 'Dinonaktifkan',
}
export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  PENDING: 'Menunggu Persetujuan', APPROVED: 'Disetujui', REJECTED: 'Ditolak',
}

export const label = <K extends string>(map: Record<K, string>, key: K | '' | null | undefined): string =>
  key ? map[key] ?? key : '-'

export function yearOptions(): string[] {
  const now = new Date().getFullYear()
  return Array.from({ length: now - 1969 }, (_, i) => String(now - i))
}
