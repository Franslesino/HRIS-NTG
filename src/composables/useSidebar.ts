import { ref } from 'vue'

const menuOpen = ref(false)
export function useSidebar() {
  return {
    menuOpen,
    toggle: () => { menuOpen.value = !menuOpen.value },
    close: () => { menuOpen.value = false },
  }
}
