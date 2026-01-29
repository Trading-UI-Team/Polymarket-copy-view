<script setup lang="ts">
useSeoMeta({
  title: 'Dashboard - PolyCopy',
  description: 'Your PolyCopy portfolio dashboard',
})
</script>

<template>
  <div class="min-h-screen bg-background-light dark:bg-background-dark">
    <!-- Header -->
    <header class="bg-card-light dark:bg-card-dark border-b border-slate-200 dark:border-slate-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-primary/10 text-primary">
              <span class="material-symbols-outlined">query_stats</span>
            </div>
            <span class="text-xl font-bold text-slate-900 dark:text-white">PolyCopy</span>
          </div>
          <NuxtLink
            to="/"
            class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            Sign Out
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Dashboard
      </h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Stats cards -->
        <div class="bg-card-light dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Balance
              </p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                $12,450.00
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-success">trending_up</span>
            </div>
          </div>
          <p class="text-sm text-success mt-3">
            +12.5% from last month
          </p>
        </div>

        <div class="bg-card-light dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Active Positions
              </p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                8
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-primary">analytics</span>
            </div>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-3">
            3 markets tracked
          </p>
        </div>

        <div class="bg-card-light dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Win Rate
              </p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                67.8%
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-warning">pie_chart</span>
            </div>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-3">
            Last 30 days
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
