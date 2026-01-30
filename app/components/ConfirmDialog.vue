<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  confirm: []
  cancel: []
}>()

// Prevent body scroll when dialog is open
watch(() => props.isOpen, (newVal) => {
  if (typeof document !== 'undefined') {
    if (newVal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

function close() {
  emit('update:isOpen', false)
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
  emit('update:isOpen', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" @click="close" />

        <!-- Dialog Panel -->
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-200 dark:border-slate-700 animate-modal-enter">
          <div class="bg-white dark:bg-slate-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div
                class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10"
                :class="[
                  type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                ]"
              >
                <span
                  class="material-symbols-outlined text-2xl"
                  :class="[
                    type === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                  ]"
                >
                  {{ type === 'danger' ? 'warning' : 'info' }}
                </span>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-base font-semibold leading-6 text-slate-900 dark:text-white">
                  {{ title }}
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ message }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-700/30 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              class="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="[
                type === 'danger'
                  ? 'bg-red-600 hover:bg-red-500 focus:ring-red-500'
                  : 'bg-primary hover:opacity-90 focus:ring-primary'
              ]"
              @click="handleConfirm"
            >
              {{ confirmText || 'Confirm' }}
            </button>
            <button
              type="button"
              class="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 sm:mt-0 sm:w-auto transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              @click="close"
            >
              {{ cancelText || 'Cancel' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-modal-enter {
  animation: modal-enter 0.2s ease-out forwards;
}
</style>
