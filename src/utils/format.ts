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

/** Backend hanya mengirim 4 digit terakhir → **** **** 5678 */
export const maskLast4 = (last4: string): string => (last4 ? `•••• •••• ${last4}` : '-')

export function displayName(p: { frontTitle: string; fullName: string; backTitle: string }): string {
  const base = [p.frontTitle, p.fullName].filter(Boolean).join(' ')
  return p.backTitle ? `${base}, ${p.backTitle}` : base
}

export const orDash = (v: string | number | undefined | null): string =>
  v === undefined || v === null || v === '' ? '-' : String(v)
