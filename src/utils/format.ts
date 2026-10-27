const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** 2022-08-01 → 01/08/2022 */
export function formatDate(iso: string): string {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** 2022-08-01 → 01 Agustus 2022 */
export function formatLongDate(iso: string): string {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`
}

/** 1370012345678 → 1370 **** **** 5678 */
export function maskAccount(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 8) return value
  return `${digits.slice(0, 4)} **** **** ${digits.slice(-4)}`
}

export function displayName(e: { frontTitle: string; name: string; backTitle: string }): string {
  const base = [e.frontTitle, e.name].filter(Boolean).join(' ')
  return e.backTitle ? `${base}, ${e.backTitle}` : base
}

export const orDash = (v: string | number | undefined | null): string =>
  v === undefined || v === null || v === '' ? '-' : String(v)

/** 1370012345678 → 137*****78 (tampilan pegawai, tanpa opsi buka) */
export function maskAccountShort(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 5) return value
  return `${digits.slice(0, 3)}*****${digits.slice(-2)}`
}
