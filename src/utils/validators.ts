export const isBlank = (v: string) => v.trim() === ''
export const isNik = (v: string) => /^\d{16}$/.test(v.trim())
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
export function isPhone(v: string): boolean {
  if (!/^\+?[\d\s-]+$/.test(v.trim())) return false
  const digits = v.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}
export const isAccountNumber = (v: string) => /^\d{6,20}$/.test(v.replace(/[\s-]/g, ''))
