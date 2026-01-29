<script setup lang="ts">
interface NavItem {
  label: string
  to: string
  active?: boolean
}

const { navItems = [] } = defineProps<{
  navItems?: NavItem[]
}>()

// Default nav items if not provided
const defaultNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', active: true },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Settings', to: '/settings' },
]

const items = navItems.length > 0 ? navItems : defaultNavItems
</script>

<template>
  <nav class="sticky top-0 z-50 bg-white/80 dark:bg-card-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <NuxtLink to="/dashboard" class="flex-shrink-0 flex items-center gap-2">
            <span class="material-symbols-outlined text-3xl" style="color: #2563EB;">query_stats</span>
            <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">PolyCopy</h1>
          </NuxtLink>
          <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
            <NuxtLink
              v-for="item in items"
              :key="item.to"
              :to="item.to"
              :class="[
                item.active
                  ? 'border-primary text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-200',
                'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
              ]"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <button
            class="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-full transition-colors"
          >
            <span class="material-symbols-outlined">notifications</span>
          </button>
          <div
            class="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm shadow-sm ring-2 ring-white dark:ring-slate-800 cursor-pointer"
          >
            JD
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
