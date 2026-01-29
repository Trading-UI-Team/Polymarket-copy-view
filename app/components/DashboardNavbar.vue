<script setup lang="ts">
// Simple navbar with just logo and avatar
</script>

<template>
  <nav class="sticky top-0 z-40 bg-white/80 dark:bg-card-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <NuxtLink to="/dashboard" class="flex-shrink-0 flex items-center gap-2">
            <span class="material-symbols-outlined text-3xl" style="color: #2563EB;">query_stats</span>
            <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">PolyCopy</h1>
          </NuxtLink>
        </div>
        <div class="flex items-center">
          <div
            class="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm ring-2 ring-white dark:ring-slate-800 cursor-pointer"
            style="background-color: #2563EB;"
          >
            JD
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
