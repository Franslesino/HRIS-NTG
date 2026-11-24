import type { Ref } from 'vue'
import { ApiError, errorMessage } from '@/api'
import { useToast } from './useToast'

/** Error API → pesan per kolom (bila ada) atau toast */
export function useApiErrors() {
  const { showError } = useToast()
  function apply(err: unknown, errors?: Ref<Record<string, string>>) {
    if (err instanceof ApiError && errors && Object.keys(err.fieldErrors).length) {
      errors.value = { ...errors.value, ...err.fieldErrors }
      return
    }
    showError(errorMessage(err))
  }
  return { apply }
}
