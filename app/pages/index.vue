<script setup lang="ts">
import type { Portfolio } from '~/components/PortfolioCard.vue'
import type { Execution } from '~/components/ExecutionsTable.vue'

useSeoMeta({
  title: 'Dashboard - PolyCopy',
  description: 'Manage your automated copy-trading portfolios',
})

// API response types
interface PortfolioAPIResponse {
  id: string
  name: string
  description: string
  mode: 'mock' | 'live'
  status: 'active' | 'paused'
  isVerified: boolean
  balance: number
  positions: number
  pnlAllTime: number
  unrealized: number
  realizedPnl: number
  equity: number
  initialFinance: number
  fixedAmount: number
  address: string
  profileUrl: string
  createdAt: number
  topPositions: Array<{
    title: string
    outcome: string
    size: number
    avgPrice: number
    curPrice: number
    currentValue: number
    cashPnl: number
    percentPnl: number | null
    asset: string
  }>
}

// Recent trade response from /api/tasks/recent-trades
interface RecentTradeAPIResponse {
  taskId: string
  taskName: string
  mode: 'mock' | 'live'
  side: string
  title: string
  outcome: string
  usdcAmount: number
  fillPrice: number
  fillSize: number
  realizedPnl?: number
  executedAt: number
}

// Loading states
const isLoading = ref(true)
const isRefreshing = ref(false)
const loadError = ref<string | null>(null)

// Portfolios data from API
const portfolios = ref<Portfolio[]>([])

// Executions data aggregated from all portfolios
const executions = ref<Execution[]>([])

// Fetch data from API (background: true means don't show full loading state)
async function fetchPortfolios(background = false) {
  // Only show full loading on initial load
  if (!background || portfolios.value.length === 0) {
    isLoading.value = true
  } else {
    isRefreshing.value = true
  }
  loadError.value = null
  
  try {
    const response = await $fetch<{ success: boolean; data: PortfolioAPIResponse[] }>('/api/tasks')
    
    if (response.success && response.data) {
      // Map API response to Portfolio type
      portfolios.value = response.data.map((p): Portfolio => ({
        id: p.id,
        name: p.name,
        description: p.description,
        mode: p.mode,
        status: p.status,
        isVerified: p.isVerified,
        balance: p.balance,
        positions: p.positions,
        pnlAllTime: p.pnlAllTime,
        unrealized: p.unrealized,
        profileUrl: p.profileUrl,
      }))
    }
  } catch (error: any) {
    console.error('Failed to fetch portfolios:', error)
    // Only show error on initial load, not background refresh
    if (!background) {
      loadError.value = error.data?.message || error.message || 'Failed to load portfolios'
    }
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// Manual refresh handler
async function handleManualRefresh() {
  if (isRefreshing.value) return
  await Promise.all([
    fetchPortfolios(true),
    fetchRecentTrades()
  ])
}

// Fetch recent trades from dedicated API
async function fetchRecentTrades() {
  try {
    const response = await $fetch<{ success: boolean; data: RecentTradeAPIResponse[] }>('/api/tasks/recent-trades')
    
    if (response.success && response.data) {
      executions.value = response.data.map((trade): Execution => {
        // Determine action type based on side and outcome
        let action: Execution['action'] = 'buy-yes'
        const side = trade.side?.toLowerCase() || 'buy'
        const outcome = trade.outcome?.toLowerCase() || 'yes'
        
        if (side === 'buy' || side === 'BUY') {
          action = outcome.includes('no') ? 'buy-no' : 'buy-yes'
        } else {
          action = outcome.includes('no') ? 'sell-no' : 'sell-yes'
        }
        
        return {
          id: `${trade.taskId}-${trade.executedAt}`,
          profile: trade.taskName,
          profileMode: trade.mode,
          market: trade.title,
          action,
          price: `${(trade.fillPrice * 100).toFixed(0)}¢`,
          time: formatTimeAgo(trade.executedAt),
        }
      })
    }
  } catch (error) {
    console.error('Failed to fetch recent trades:', error)
    // Don't set error - just leave executions empty
  }
}

// Format timestamp to relative time
function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Unknown'
  
  const now = Date.now()
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

// Fetch on mount
onMounted(() => {
  fetchPortfolios()
  fetchRecentTrades()
})

// Auto-refresh every 30 seconds
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)
onMounted(() => {
  refreshInterval.value = setInterval(() => {
    fetchPortfolios(true) // Background refresh
    fetchRecentTrades()
  }, 30000)
})
onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

// Loading states for actions
const isActionLoading = ref<string | null>(null)

// Portfolio actions
async function handlePause(id: string) {
  const portfolio = portfolios.value.find(p => p.id === id)
  if (!portfolio) return
  
  isActionLoading.value = id
  try {
    const { data } = await $fetch<{ success: boolean; data: any }>('/api/traders/stop', {
      method: 'POST',
      body: { taskId: id }
    })
    
    if (data?.success !== false) {
      portfolio.status = 'paused'
    }
  } catch (error: any) {
    console.error('Failed to pause trader:', error)
    const errorMsg = error.data?.message || error.message || 'Failed to pause trader'
    alert(`Error: ${errorMsg}`)
  } finally {
    isActionLoading.value = null
  }
}

async function handleResume(id: string) {
  const portfolio = portfolios.value.find(p => p.id === id)
  if (!portfolio) return
  
  isActionLoading.value = id
  try {
    const { data } = await $fetch<{ success: boolean; data: any }>('/api/traders/restart', {
      method: 'POST',
      body: { taskId: id }
    })
    
    if (data?.success !== false) {
      portfolio.status = 'active'
    }
  } catch (error: any) {
    console.error('Failed to resume trader:', error)
    const errorMsg = error.data?.message || error.message || 'Failed to resume trader'
    alert(`Error: ${errorMsg}`)
  } finally {
    isActionLoading.value = null
  }
}

// Confirm Delete logic
const showConfirmDelete = ref(false)
const traderToDelete = ref<string | null>(null)
const isDeleting = ref(false)

function handleDelete(id: string) {
  traderToDelete.value = id
  showConfirmDelete.value = true
}

async function confirmDelete() {
  if (!traderToDelete.value) return
  
  isDeleting.value = true
  try {
    await $fetch<{ success: boolean; data: any }>('/api/traders/remove', {
      method: 'POST',
      body: { taskId: traderToDelete.value }
    })
    
    // Refresh portfolios from API
    await fetchPortfolios()
    console.log('Deleted trader:', traderToDelete.value)
  } catch (error: any) {
    console.error('Failed to delete trader:', error)
    const errorMsg = error.data?.message || error.message || 'Failed to delete trader'
    alert(`Error: ${errorMsg}`)
  } finally {
    isDeleting.value = false
    traderToDelete.value = null
    showConfirmDelete.value = false
  }
}

function handleSettings(id: string) {
  // TODO: Open settings modal
  console.log('Open settings for:', id)
}

// Dialog state
const showAddTraderDialog = ref(false)

function handleAddProfile() {
  showAddTraderDialog.value = true
}

const isCreating = ref(false)

async function handleCreateTrader(data: { mode: 'mock' | 'live'; form: any }) {
  console.log('Creating trader:', data)
  isCreating.value = true
  
  try {
    const payload = {
      type: data.mode,
      profile: data.form.profileUrl,
      fixedAmount: data.form.amountPerTrade,
      initialAmount: data.form.initialCapital || 0,
      myWalletAddress: data.form.walletAddress,
      privateKey: data.form.privateKey
    }

    const response = await $fetch<{ success: boolean; data: any }>('/api/traders/create', {
      method: 'POST',
      body: payload
    })

    if (response.success) {
      // Refresh portfolios from API to get the latest data
      await fetchPortfolios()
      showAddTraderDialog.value = false // Close dialog on success
    } else {
       throw new Error('Failed to create trader')
    }
  } catch (error: any) {
    console.error('Failed to create trader:', error)
    // Show a more friendly error message
    const errorMsg = error.data?.message || error.message || 'Failed to connect to Polymarket API.'
    alert(`Error: ${errorMsg}`)
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-300">
    <!-- Navbar -->
    <DashboardNavbar />

    <!-- Main content -->
    <main class="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
      <!-- Header -->
      <div class="md:flex md:items-center md:justify-between mb-8">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Active Portfolios
            <span v-if="isCreating" class="ml-2 text-sm font-normal text-slate-500 animate-pulse">
              (Connecting to Polymarket...)
            </span>
          </h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your automated betting strategies and track performance across mock and live environments.
          </p>
        </div>
        <div class="mt-4 flex gap-3 md:ml-4 md:mt-0">
          <!-- Refresh Button -->
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            :disabled="isRefreshing"
            @click="handleManualRefresh"
          >
            <span 
              class="material-symbols-outlined text-lg transition-transform"
              :class="{ 'animate-spin': isRefreshing }"
            >refresh</span>
            <span class="hidden sm:inline">{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
          <!-- Add Profile Button -->
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
            style="background-color: #2563EB; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);"
            @click="handleAddProfile"
          >
            <span class="material-symbols-outlined text-lg">add</span>
            Add New Profile
          </button>
        </div>
      </div>

      <!-- Portfolio grid -->
      <!-- Loading State (only shown on initial load) -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="n in 3" :key="n" class="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-pulse min-w-[320px]">
          <!-- Left border indicator skeleton -->
          <div class="absolute top-0 left-0 w-1 h-full bg-slate-300 dark:bg-slate-600"></div>
          
          <!-- Content section -->
          <div class="p-6">
            <!-- Header row with badge -->
            <div class="flex items-center gap-2 mb-4">
              <div class="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            </div>
            <!-- Name -->
            <div class="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <!-- Link/Description -->
            <div class="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
            <!-- Stats grid 2x2 -->
            <div class="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <div class="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div class="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div>
                <div class="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div class="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div>
                <div class="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div class="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div>
                <div class="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div class="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
          
          <!-- Footer section -->
          <div class="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="h-2.5 w-2.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
              <div class="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div class="flex gap-2">
              <div class="h-7 w-7 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div class="h-7 w-7 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="text-center py-12">
        <span class="material-symbols-outlined text-5xl text-danger mb-4">error</span>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Failed to Load Portfolios</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">{{ loadError }}</p>
        <button
          class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
          style="background-color: #2563EB;"
          @click="fetchPortfolios"
        >
          <span class="material-symbols-outlined text-lg">refresh</span>
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="portfolios.length === 0" class="text-center py-12">
        <span class="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500 mb-4">folder_open</span>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Portfolios Yet</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Get started by adding your first copy trading profile.</p>
        <button
          class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
          style="background-color: #2563EB;"
          @click="handleAddProfile"
        >
          <span class="material-symbols-outlined text-lg">add</span>
          Add Profile
        </button>
      </div>

      <!-- Portfolios Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PortfolioCard
          v-for="portfolio in portfolios"
          :key="portfolio.id"
          :portfolio="portfolio"
          @pause="handlePause"
          @resume="handleResume"
          @delete="handleDelete"
          @settings="handleSettings"
        />
      </div>

      <!-- Add Trader Dialog -->
      <AddTraderDialog
        v-model="showAddTraderDialog"
        :loading="isCreating"
        @create="handleCreateTrader"
      />

      <!-- Confirm Delete Dialog -->
      <ConfirmDialog
        v-model:is-open="showConfirmDelete"
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action will stop all copy trading for this profile and cannot be undone."
        type="danger"
        confirm-text="Delete"
        @confirm="confirmDelete"
      />


      <!-- Executions table -->
      <ExecutionsTable v-if="!isLoading" :executions="executions" />
    </main>

    <!-- Footer -->
    <DashboardFooter />
  </div>
</template>
