import { reactive, computed } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

const state = reactive({
  toasts: [] as Toast[]
})

let nextId = 0

export const useToast = () => {
  const add = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    const id = nextId++
    state.toasts.push({ id, message, type, duration })
    
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
  }

  const remove = (id: number) => {
    const index = state.toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      state.toasts.splice(index, 1)
    }
  }

  return {
    toasts: computed(() => state.toasts),
    add,
    remove,
    success: (msg: string, duration?: number) => add(msg, 'success', duration),
    error: (msg: string, duration?: number) => add(msg, 'error', duration),
    info: (msg: string, duration?: number) => add(msg, 'info', duration)
  }
}
