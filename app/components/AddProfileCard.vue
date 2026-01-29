<script setup lang="ts">
const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="min-h-[300px] flex flex-col items-center justify-center bg-transparent border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group cursor-pointer text-center"
    @click="emit('click')"
  >
    <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
      <span class="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 group-hover:text-white">add</span>
    </div>
    <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-1">
      Add New Profile
    </h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">
      Create a new copy-trading profile for mock or live betting.
    </p>
  </button>
</template>
