import { ref } from 'vue'

type ToastKind = 'success' | 'error'
interface Toast { id: number; message: string; kind: ToastKind }
const toasts = ref<Toast[]>([])
let seq = 0

export function useToast() {
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }
  function push(message: string, kind: ToastKind, duration: number) {
    const id = ++seq
    toasts.value.push({ id, message, kind })
    setTimeout(() => dismiss(id), duration)
  }
  const show = (message: string, duration = 3500) => push(message, 'success', duration)
  const showError = (message: string, duration = 5000) => push(message, 'error', duration)
  return { toasts, show, showError, dismiss }
}
