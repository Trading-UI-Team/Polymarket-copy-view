<script setup lang="ts">
const { toasts, remove } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-x-12 opacity-0"
        enter-to-class="transform translate-x-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-x-0 opacity-100"
        leave-to-class="transform translate-x-12 opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto min-w-[300px] max-w-md px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 backdrop-blur-md bg-white/90 dark:bg-slate-800/90"
          :class="[
            toast.type === 'success' ? 'border-emerald-200/50 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300' :
            toast.type === 'error' ? 'border-rose-200/50 dark:border-rose-500/30 text-rose-800 dark:text-rose-300' :
            'border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200'
          ]"
        >
          <div 
            class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            :class="[
                toast.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/20' :
                toast.type === 'error' ? 'bg-rose-100 dark:bg-rose-500/20' :
                'bg-slate-100 dark:bg-slate-700'
            ]"
          >
            <span class="material-symbols-outlined text-xl">
                {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info' }}
            </span>
          </div>
          <span class="text-sm font-semibold flex-1 overflow-hidden text-ellipsis">{{ toast.message }}</span>
          <button 
            @click="remove(toast.id)" 
            class="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
