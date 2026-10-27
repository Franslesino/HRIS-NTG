import { ref } from 'vue'

interface Toast { id: number; message: string }
const toasts = ref<Toast[]>([])
let seq = 0

export function useToast() {
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }
  function show(message: string, duration = 3500) {
    const id = ++seq
    toasts.value.push({ id, message })
    setTimeout(() => dismiss(id), duration)
  }
  return { toasts, show, dismiss }
}
