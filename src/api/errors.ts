/** Error dari API. fieldErrors dipetakan ke kolom form (mis. nomor pegawai duplikat). */
export class ApiError extends Error {
  constructor(message: string, public fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
  }
}

export const errorMessage = (err: unknown): string =>
  err instanceof Error && err.message ? err.message : 'Terjadi kesalahan. Coba lagi.'
