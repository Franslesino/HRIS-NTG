import type { EducationLevel } from '@/types/employee'

export const GENDERS = ['Laki-laki', 'Perempuan']
export const MARITAL_STATUSES = ['Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati']
export const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']
export const BLOOD_TYPES = ['A', 'B', 'AB', 'O']
export const RELATIONS = ['Suami', 'Istri', 'Anak Pertama', 'Anak Kedua', 'Anak Ketiga', 'Ayah', 'Ibu']
export const BANKS = [
  'Bank Mandiri', 'Bank BCA', 'Bank BNI', 'Bank BRI',
  'Bank Syariah Indonesia', 'Bank CIMB Niaga', 'Bank Permata',
]
export const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'SMA', label: 'SMA/SMK' },
  { value: 'D3', label: 'Diploma (D3)' },
  { value: 'S1', label: 'Sarjana (S1)' },
  { value: 'S2', label: 'Magister (S2)' },
  { value: 'S3', label: 'Doktor (S3)' },
]
export const educationLabel = (v: EducationLevel) =>
  EDUCATION_LEVELS.find((l) => l.value === v)?.label ?? v

export function yearOptions(): string[] {
  const now = new Date().getFullYear()
  return Array.from({ length: now - 1969 }, (_, i) => String(now - i))
}
