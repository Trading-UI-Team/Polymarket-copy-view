<script setup lang="ts">
export interface Portfolio {
  id: string
  name: string
  description: string
  mode: 'mock' | 'live'
  status: 'active' | 'paused'
  isVerified?: boolean
  balance: number
  positions: number
  pnlAllTime: number
  unrealized: number
}

const { portfolio } = defineProps<{
  portfolio: Portfolio
}>()

const emit = defineEmits<{
  pause: [id: string]
  resume: [id: string]
  delete: [id: string]
  settings: [id: string]
}>()

// Determine colors based on mode
const modeColor = computed(() => {
  if (portfolio.mode === 'mock') return 'warning'
  return portfolio.status === 'active' ? 'success' : 'slate'
})

const borderColor = computed(() => {
  if (portfolio.mode === 'mock') return 'bg-warning'
  return portfolio.status === 'active' ? 'bg-success' : 'bg-slate-400'
})

// Format currency
function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(value))

  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted.replace('$', '$')}`
  return formatted
}
</script>

<template>
  <div
    :class="[
      'bg-white dark:bg-card-dark rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col relative group',
      portfolio.status === 'paused' ? 'opacity-75 hover:opacity-100' : '',
    ]"
  >
    <!-- Left border indicator -->
    <div :class="['absolute top-0 left-0 w-1 h-full', borderColor]" />

    <div class="p-6 flex-1">
      <!-- Header row -->
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-2">
          <span
            :class="[
              'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset uppercase tracking-wider',
              portfolio.mode === 'mock'
                ? 'bg-warning/10 text-warning ring-warning/20'
                : portfolio.status === 'active'
                  ? 'bg-success/10 text-success ring-success/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-500/10',
            ]"
          >
            {{ portfolio.mode === 'mock' ? 'Mock' : 'Live' }}
          </span>
          <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">
            ID: #{{ portfolio.id }}
          </span>
        </div>
        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Settings"
            @click="emit('settings', portfolio.id)"
          >
            <span class="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>

      <!-- Name and description -->
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
        {{ portfolio.name }}
        <span
          v-if="portfolio.isVerified"
          class="material-symbols-outlined text-lg"
          style="color: #2563EB;"
          title="Top Trader"
        >
          verified
        </span>
      </h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {{ portfolio.description }}
      </p>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
        <div>
          <p class="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
            Total Balance
          </p>
          <p class="text-slate-900 dark:text-slate-100 font-semibold text-base mt-0.5">
            ${{ portfolio.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
          </p>
        </div>
        <div>
          <p class="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
            Positions
          </p>
          <p class="text-slate-900 dark:text-slate-100 font-semibold text-base mt-0.5">
            {{ portfolio.positions }}
          </p>
        </div>
        <div>
          <p class="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
            PnL (All Time)
          </p>
          <p
            :class="[
              'font-semibold text-base mt-0.5 flex items-center',
              portfolio.pnlAllTime >= 0 ? 'text-success' : 'text-danger',
            ]"
          >
            {{ formatCurrency(portfolio.pnlAllTime) }}
            <span class="material-symbols-outlined text-sm ml-0.5">
              {{ portfolio.pnlAllTime >= 0 ? 'trending_up' : 'trending_down' }}
            </span>
          </p>
        </div>
        <div>
          <p class="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
            Unrealized
          </p>
          <p
            :class="[
              'font-semibold text-base mt-0.5 flex items-center',
              portfolio.unrealized > 0
                ? 'text-success'
                : portfolio.unrealized < 0
                  ? 'text-danger'
                  : 'text-slate-500 dark:text-slate-400',
            ]"
          >
            {{ portfolio.unrealized === 0 ? '$0.00' : formatCurrency(portfolio.unrealized) }}
            <span v-if="portfolio.unrealized !== 0" class="material-symbols-outlined text-sm ml-0.5">
              {{ portfolio.unrealized >= 0 ? 'trending_up' : 'trending_down' }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <span v-if="portfolio.status === 'active'" class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
        </span>
        <span v-else class="h-2.5 w-2.5 rounded-full bg-slate-400" />
        <span class="text-xs font-medium text-slate-600 dark:text-slate-300">
          {{ portfolio.status === 'active' ? 'Active' : 'Paused' }}
        </span>
      </div>
      <div class="flex gap-2">
        <button
          v-if="portfolio.status === 'active'"
          class="text-slate-600 dark:text-slate-300 hover:text-warning dark:hover:text-warning transition-colors p-1"
          title="Pause Trading"
          @click="emit('pause', portfolio.id)"
        >
          <span class="material-symbols-outlined text-[20px]">pause_circle</span>
        </button>
        <button
          v-else
          class="text-slate-600 dark:text-slate-300 hover:text-success dark:hover:text-success transition-colors p-1"
          title="Resume Trading"
          @click="emit('resume', portfolio.id)"
        >
          <span class="material-symbols-outlined text-[20px]">play_circle</span>
        </button>
        <button
          class="text-slate-600 dark:text-slate-300 hover:text-danger dark:hover:text-danger transition-colors p-1"
          title="Delete Profile"
          @click="emit('delete', portfolio.id)"
        >
          <span class="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  </div>
</template>
