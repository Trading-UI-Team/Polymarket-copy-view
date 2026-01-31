<script setup lang="ts">
// Get route params
const route = useRoute()
const taskId = computed(() => route.params.taskId as string)

// API response types
interface PositionData {
  title: string
  outcome: string
  size: number
  avgPrice: number
  curPrice: number
  currentValue: number
  cashPnl: number
  percentPnl: number | null
  asset: string
  conditionId: string
  slug: string
  eventSlug: string
  icon: string
  endDate: string
  realizedPnl: number
}

interface TradeRecordData {
  id: string
  taskId: string
  side: string
  asset: string
  conditionId: string
  outcomeIndex: number
  fillPrice: number
  fillSize: number
  usdcAmount: number
  slippage: number
  realizedPnl: number | null
  executedAt: number
  title: string
  slug: string
  eventSlug: string
  outcome: string
}

interface TaskDetail {
  id: string
  name: string
  description: string
  mode: 'mock' | 'live'
  status: 'active' | 'paused'
  isVerified: boolean
  balance: number
  positionCount: number
  pnlAllTime: number
  unrealized: number
  realizedPnl: number
  equity: number
  initialFinance: number
  fixedAmount: number
  address: string
  myWalletAddress: string
  profileUrl: string
  createdAt: number
  positions: PositionData[]
  recentTrades: TradeRecordData[]
}

// Loading states
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const task = ref<TaskDetail | null>(null)

// SEO
useSeoMeta({
  title: () => task.value ? `${task.value.name} - PolyCopy` : 'Loading... - PolyCopy',
  description: () => task.value ? `View trader details and performance for ${task.value.name}` : 'Loading task details',
})

// Import Chart.js components
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

// Time range selector
type TimeRange = '1D' | '1W' | 'ALL'
const selectedRange = ref<TimeRange>('ALL')
const isLoadingChart = ref(false)

// Performance data from API
const performanceData = ref<{
  labels: string[]
  values: number[]
}>({
  labels: [],
  values: [],
})

// Fetch performance data from API
async function fetchPerformanceData() {
  if (!taskId.value) return
  
  isLoadingChart.value = true
  try {
    const response = await $fetch<{
      success: boolean
      data: {
        labels: string[]
        values: number[]
        range: string
        initialFinance: number
        currentEquity: number
      }
    }>(`/api/tasks/${taskId.value}/performance`, {
      query: { range: selectedRange.value }
    })
    
    if (response.success && response.data) {
      performanceData.value = {
        labels: response.data.labels,
        values: response.data.values,
      }
    }
  } catch (error) {
    console.error('Failed to fetch performance data:', error)
    // Fallback to basic data
    performanceData.value = {
      labels: ['Start', 'Current'],
      values: task.value ? [task.value.initialFinance, task.value.equity] : [0, 0],
    }
  } finally {
    isLoadingChart.value = false
  }
}

// Watch for range changes
watch(selectedRange, () => {
  fetchPerformanceData()
})

// Chart Data (populated from API)
const chartData = computed(() => ({
  labels: performanceData.value.labels.length > 0 
    ? performanceData.value.labels 
    : ['Start', 'Current'],
  datasets: [
    {
      label: 'Portfolio Value',
      data: performanceData.value.values.length > 0 
        ? performanceData.value.values 
        : task.value ? [task.value.initialFinance, task.value.equity] : [0, 0],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#3B82F6',
    },
  ],
}))

// Chart Options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        color: '#E5E7EB',
      },
      ticks: {
        color: '#6B7280',
      },
    },
    y: {
      grid: {
        borderDash: [5, 5],
        color: '#E5E7EB',
      },
      ticks: {
        color: '#6B7280',
        callback: function (value: any) {
          return '$' + value
        },
      },
    },
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
}


// Fetch task details
async function fetchTaskDetail(background = false) {
  if (!background) {
    isLoading.value = true
  }
  loadError.value = null
  
  try {
    const response = await $fetch<{ success: boolean; data: TaskDetail }>(`/api/tasks/${taskId.value}`)
    
    if (response.success && response.data) {
      task.value = response.data
    }
  } catch (error: any) {
    console.error('Failed to fetch task details:', error)
    if (!background) {
      loadError.value = error.data?.statusMessage || error.message || 'Failed to load task details'
    }
  } finally {
    if (!background) {
      isLoading.value = false
    }
  }
}

// Fetch on mount
onMounted(async () => {
  await fetchTaskDetail()
  await fetchPerformanceData()
})

// Auto-refresh every 30 seconds
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)
onMounted(() => {
  refreshInterval.value = setInterval(() => {
    fetchTaskDetail(true)
  }, 30000)
})
onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

// Actions

const toast = { 
  success: (msg: any) => console.log('Success:', msg), 
  error: (msg: any) => console.error('Error:', msg) 
}

const isActionLoading = ref(false)

async function toggleBotStatus() {
  if (!task.value) return
  
  isActionLoading.value = true
  try {
    if (task.value.status === 'active') {
      await $fetch('/api/traders/stop', {
        method: 'POST',
        body: { taskId: task.value.id }
      })
      task.value.status = 'paused'
      toast.success('Trader paused')
    } else {
      await $fetch('/api/traders/restart', {
        method: 'POST',
        body: { taskId: task.value.id }
      })
      task.value.status = 'active'
      toast.success('Trader resumed')
    }
  } catch (error: any) {
    console.error('Failed to toggle status:', error)
    toast.error(error.data?.message || error.message || 'Failed to toggle status')
  } finally {
    isActionLoading.value = false
  }
}

// Confirm Dialog
const showConfirmDelete = ref(false)
const isDeleting = ref(false)

// Edit Dialog
const showEditDialog = ref(false)
const isUpdating = ref(false)
const editingTraderData = ref<any>(null)

function openSettings() {
  if (!task.value) return
  
  editingTraderData.value = {
    mode: task.value.mode,
    profileUrl: task.value.profileUrl || '',
    amountPerTrade: task.value.fixedAmount || 5,
    initialCapital: task.value.initialFinance || 100,
    walletAddress: task.value.myWalletAddress || '', 
    privateKey: '**************************' // Dont expose real private key, just a placeholder to indicate it exists
  }
  showEditDialog.value = true
}

async function handleUpdateTrader(data: { taskId?: string; mode: 'mock' | 'live'; form: any }) {
  if (!task.value) return
  
  isUpdating.value = true
  // Check if private key is the placeholder, if so, dont send it to avoid overwriting with stars
  const isPlaceholderKey = data.form.privateKey === '**************************'
  
  const payload = {
      taskId: task.value.id,
      type: data.mode,
      profile: data.form.profileUrl,
      fixedAmount: data.form.amountPerTrade,
      initialAmount: data.form.initialCapital || 0,
      myWalletAddress: data.form.walletAddress,
      privateKey: isPlaceholderKey ? undefined : data.form.privateKey
  }
  
  try {
     const response = await $fetch<{ success: boolean; data: any }>('/api/traders/update', {
      method: 'POST',
      body: payload
    })

    if (response.success) {
      await fetchTaskDetail()
      showEditDialog.value = false
      toast.success('Trader updated successfully')
    } else {
        throw new Error('Failed to update trader')
    }
  } catch (error: any) {
    console.error('Failed to update trader:', error)
    const errorMsg = error.data?.message || error.message || 'Failed to update trader.'
    toast.error(errorMsg)
  } finally {
    isUpdating.value = false
  }
}

function deleteBot() {
  showConfirmDelete.value = true
}

async function handleConfirmDelete() {
  if (!task.value) return
  
  isDeleting.value = true
  try {
    await $fetch('/api/traders/remove', {
      method: 'POST',
      body: { taskId: task.value.id }
    })
    toast.success('Trader deleted successfully')
    navigateTo('/')
  } catch (error: any) {
    console.error('Failed to delete trader:', error)
    const errorMsg = error.data?.message || error.message || 'Failed to delete trader'
    toast.error(errorMsg)
  } finally {
    isDeleting.value = false
  }
}

function scrollToPositions() {
  const el = document.getElementById('current-positions')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}


// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

// Format percentage
function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// Format time ago
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
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-300">
    <!-- Navbar -->
    <DashboardNavbar />

    <!-- Main content -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-1 w-full">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-lg">Loading task details...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="text-center py-12">
        <span class="material-symbols-outlined text-5xl text-danger mb-4">error</span>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Failed to Load Task</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">{{ loadError }}</p>
        <div class="flex gap-4 justify-center">
          <button
            class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
            style="background-color: #2563EB;"
            @click="() => fetchTaskDetail()"
          >
            <span class="material-symbols-outlined text-lg">refresh</span>
            Retry
          </button>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <span class="material-symbols-outlined text-lg">arrow_back</span>
            Back to Dashboard
          </NuxtLink>
        </div>
      </div>

      <!-- Task Details -->
      <template v-else-if="task">
        <!-- Header with Breadcrumb -->
        <div class="md:flex md:items-center md:justify-between mb-8">
          <div class="flex-1 min-w-0">
            <!-- Breadcrumb -->
            <nav aria-label="Breadcrumb" class="flex mb-2">
              <ol class="flex items-center space-x-2" role="list">
                <li>
                  <NuxtLink to="/" class="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                    <span class="material-symbols-outlined text-sm">home</span>
                  </NuxtLink>
                </li>
                <li><span class="text-slate-300 dark:text-slate-600">/</span></li>
                <li>
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Tasks</span>
                </li>
                <li><span class="text-slate-300 dark:text-slate-600">/</span></li>
                <li aria-current="page" class="text-sm font-medium text-slate-900 dark:text-white">
                  {{ task.name }}
                </li>
              </ol>
            </nav>

            <!-- Title -->
            <h2 class="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate flex items-center gap-3 flex-wrap">
              {{ task.name }}
              <a
                :href="task.profileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center text-slate-400 hover:text-primary transition-colors duration-200"
                title="View Polymarket Profile"
              >
                <span class="material-symbols-outlined text-2xl">open_in_new</span>
              </a>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
                  task.mode === 'mock'
                    ? 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-500/20'
                    : 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/20',
                ]"
              >
                {{ task.mode === 'mock' ? 'Mock' : 'Live' }}
              </span>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
                  task.status === 'active'
                    ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/20'
                    : 'bg-slate-50 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/40',
                ]"
              >
                {{ task.status === 'active' ? 'Running' : 'Paused' }}
              </span>
            </h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ task.description }} · Created {{ formatTimeAgo(task.createdAt) }}
            </p>
          </div>

          <!-- Actions -->
          <div class="mt-4 flex md:mt-0 md:ml-4 gap-3">
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
              :disabled="isActionLoading"
              @click="toggleBotStatus"
            >
              <span v-if="isActionLoading" class="material-symbols-outlined mr-2 text-base animate-spin">progress_activity</span>
              <span v-else class="material-symbols-outlined mr-2 text-base">
                {{ task.status === 'active' ? 'pause' : 'play_arrow' }}
              </span>
              {{ task.status === 'active' ? 'Pause' : 'Resume' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :class="[
                 task.status === 'active' 
                   ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                   : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
              ]"
              :disabled="task.status === 'active'"
              title="Settings (Pause to edit)"
              @click="openSettings"
            >
              <span class="material-symbols-outlined mr-2 text-base">settings</span>
              Settings
            </button>
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              @click="deleteBot"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Edit Dialog -->
        <AddTraderDialog
          v-model="showEditDialog"
          :loading="isUpdating"
          :edit-mode="true"
          :initial-data="editingTraderData"
          @update="handleUpdateTrader"
        />

        <!-- Confirm Dialog -->
        <ConfirmDialog
          v-model:is-open="showConfirmDelete"
          title="Delete Trader Bot"
          :message="`Are you sure you want to delete ${task.name}? This action cannot be undone and will close all active positions.`"
          type="danger"
          confirm-text="Delete"
          @confirm="handleConfirmDelete"
        />

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <!-- Total PnL -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="p-5">
              <div class="flex items-center">
                <div :class="['flex-shrink-0 rounded-md p-3', task.pnlAllTime >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30']">
                  <span :class="['material-symbols-outlined', task.pnlAllTime >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']">paid</span>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Total PnL</dt>
                    <dd>
                      <div :class="['text-lg font-medium', task.pnlAllTime >= 0 ? 'text-green-600' : 'text-red-600']">
                        {{ formatCurrency(task.pnlAllTime) }}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-700/50 px-5 py-3">
              <div class="text-sm">
                <span :class="task.pnlAllTime >= 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
                  {{ formatPercent((task.pnlAllTime / task.initialFinance) * 100) }}
                </span>
                <span class="text-slate-500 dark:text-slate-400"> from initial</span>
              </div>
            </div>
          </div>

          <!-- Unrealized PnL -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-md p-3">
                  <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">trending_up</span>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Unrealized PnL</dt>
                    <dd>
                      <div :class="['text-lg font-medium', task.unrealized >= 0 ? 'text-green-600' : 'text-red-600']">
                        {{ formatCurrency(task.unrealized) }}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-700/50 px-5 py-3">
              <div class="text-sm">
                <span class="text-slate-500 dark:text-slate-400">Open positions value</span>
              </div>
            </div>
          </div>

          <!-- Realized PnL -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 rounded-md p-3">
                  <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">analytics</span>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Realized PnL</dt>
                    <dd>
                      <div :class="['text-lg font-medium', task.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600']">
                        {{ formatCurrency(task.realizedPnl) }}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-700/50 px-5 py-3">
              <div class="text-sm">
                <span class="text-slate-500 dark:text-slate-400">Closed trades profit</span>
              </div>
            </div>
          </div>

          <!-- Positions -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-200 dark:border-slate-700">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 rounded-md p-3">
                  <span class="material-symbols-outlined text-orange-600 dark:text-orange-400">layers</span>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Positions</dt>
                    <dd>
                      <div class="text-lg font-medium text-slate-900 dark:text-white">{{ task.positionCount }} Active</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-700/50 px-5 py-3">
              <div class="text-sm">
              <div class="text-sm">
                <a href="#current-positions" class="font-medium hover:opacity-80 cursor-pointer" style="color: #2563EB;" @click.prevent="scrollToPositions">View all positions</a>
              </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Balance Cards -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Current Balance</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ formatCurrency(task.balance) }}</p>
              </div>
              <span class="material-symbols-outlined text-3xl text-blue-500">account_balance_wallet</span>
            </div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Equity</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ formatCurrency(task.equity) }}</p>
              </div>
              <span class="material-symbols-outlined text-3xl text-green-500">savings</span>
            </div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Initial Investment</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ formatCurrency(task.initialFinance) }}</p>
              </div>
              <span class="material-symbols-outlined text-3xl text-purple-500">attach_money</span>
            </div>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Fixed Amount</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ formatCurrency(task.fixedAmount) }}</p>
              </div>
              <span class="material-symbols-outlined text-3xl text-orange-500">lock</span>
            </div>
          </div>
        </div>

        <!-- Performance Chart -->
        <div class="mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-white">Portfolio Performance</h3>
              <!-- Time Range Selector -->
              <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  v-for="range in (['1D', '1W', 'ALL'] as const)"
                  :key="range"
                  :class="[
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                    selectedRange === range
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  ]"
                  @click="selectedRange = range"
                >
                  {{ range }}
                </button>
              </div>
            </div>
            <div class="relative h-72 w-full">
              <!-- Loading overlay -->
              <div v-if="isLoadingChart" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 z-10">
                <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <Line :data="chartData" :options="chartOptions" />
            </div>
          </div>
        </div>

        <!-- Current Positions Table -->
        <div id="current-positions" class="mb-8">
          <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-white mb-4">
            Current Positions ({{ task.positions.length }})
          </h3>
          <div class="flex flex-col">
            <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div class="shadow overflow-hidden border border-slate-200 dark:border-slate-700 sm:rounded-lg">
                  <table v-if="task.positions.length > 0" class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead class="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Market</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outcome</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entry Price</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Price</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shares</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unrealized PnL</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      <tr v-for="position in task.positions" :key="position.asset">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-slate-900 dark:text-white">{{ position.title }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span
                            :class="[
                              'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                              position.outcome.toLowerCase() === 'yes'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                            ]"
                          >
                            {{ position.outcome }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {{ (position.avgPrice * 100).toFixed(0) }}¢
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">
                          {{ (position.curPrice * 100).toFixed(0) }}¢
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {{ position.size.toFixed(2) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">
                          {{ formatCurrency(position.currentValue) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span
                            :class="[
                              'text-sm font-medium',
                              position.cashPnl >= 0 ? 'text-green-600' : 'text-red-600',
                            ]"
                          >
                            {{ formatCurrency(position.cashPnl) }}
                            <span v-if="position.percentPnl !== null" class="text-xs">
                              ({{ formatPercent(position.percentPnl) }})
                            </span>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-else class="px-6 py-12 text-center">
                    <span class="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 mb-2">inbox</span>
                    <p class="text-sm text-slate-500 dark:text-slate-400">No open positions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Trade History -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-white">Trade History ({{ task.recentTrades.length }})</h3>
          </div>
          <div class="bg-white dark:bg-slate-800 shadow sm:rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div v-if="task.recentTrades.length > 0" class="max-h-[400px] overflow-y-auto custom-scrollbar">
              <ul role="list" class="divide-y divide-slate-200 dark:divide-slate-700">
                <li v-for="trade in task.recentTrades" :key="trade.id">
                  <div class="block hover:bg-slate-50 dark:hover:bg-slate-700/50 transition duration-150 ease-in-out">
                    <div class="px-4 py-4 sm:px-6">
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium truncate" style="color: #2563EB;">
                          {{ trade.side }} '{{ trade.outcome || 'Unknown' }}' on "{{ trade.title || 'Unknown Market' }}"
                        </p>
                        <div class="ml-2 flex-shrink-0 flex gap-2">
                          <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {{ formatCurrency(trade.usdcAmount) }}
                          </p>
                          <p
                            v-if="trade.realizedPnl !== null"
                            :class="[
                              'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                              trade.realizedPnl >= 0
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                            ]"
                          >
                            PnL: {{ formatCurrency(trade.realizedPnl) }}
                          </p>
                        </div>
                      </div>
                      <div class="mt-2 sm:flex sm:justify-between">
                        <div class="sm:flex">
                          <p class="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <span class="material-symbols-outlined text-sm mr-1">attach_money</span>
                            Price: {{ (trade.fillPrice * 100).toFixed(0) }}¢ · Size: {{ trade.fillSize.toFixed(2) }}
                          </p>
                        </div>
                        <div class="mt-2 flex items-center text-sm text-slate-500 dark:text-slate-400 sm:mt-0">
                          <span class="material-symbols-outlined text-sm mr-1">schedule</span>
                          <p>{{ formatTimeAgo(trade.executedAt) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div v-else class="px-6 py-12 text-center">
              <span class="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 mb-2">history</span>
              <p class="text-sm text-slate-500 dark:text-slate-400">No trade history yet</p>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Footer -->
    <DashboardFooter />
  </div>
</template>
