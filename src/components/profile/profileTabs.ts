export type ProfileTab = 'data' | 'jabatan' | 'pendidikan' | 'keluarga' | 'rekening'

export const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: 'data', label: 'Data Pribadi' },
  { key: 'jabatan', label: 'Riwayat Jabatan/Pekerjaan' },
  { key: 'pendidikan', label: 'Riwayat Pendidikan' },
  { key: 'keluarga', label: 'Data Keluarga' },
  { key: 'rekening', label: 'Rekening Bank' },
]

export const isProfileTab = (v: unknown): v is ProfileTab =>
  PROFILE_TABS.some((t) => t.key === v)
