<script setup lang="ts">
// Get route params
const route = useRoute()
const traderName = computed(() => route.params.traderName as string)

useSeoMeta({
  title: () => `${traderName.value} - PolyCopy`,
  description: () => `View trader details and performance for ${traderName.value}`,
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

// Mock trader data (in real app, fetch from API based on traderName)
const trader = reactive({
  name: traderName.value,
  mode: (route.query.mode as 'mock' | 'live') || 'mock',
  status: (route.query.status as 'active' | 'paused') || 'active',
  polymarketUrl: `https://polymarket.com/profile/${traderName.value.toLowerCase()}`,
  totalProfit: 1240.50,
  profitPercent: 12,
  unrealizedPnl: 320.00,
  winRate: 68.5,
  closedTrades: 142,
  activePositions: 5,
})

// Chart Data
const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'Portfolio Value',
      data: [1000, 1200, 1150, 1340, 1600, 1550, 1890],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#3B82F6',
    },
  ],
}

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

// Configuration form
const config = reactive({
  maxBet: 100,
  stopLoss: 15,
  autoCompound: false,
})

// Current positions mock data
const positions = ref([
  {
    id: '1',
    market: 'Will Trump win 2024?',
    category: 'Politics',
    outcome: 'yes',
    entryPrice: 0.52,
    currentPrice: 0.58,
    shares: 100,
    pnl: 6.00,
    pnlPercent: 11.5,
  },
  {
    id: '2',
    market: 'BTC > $100k in 2024',
    category: 'Crypto',
    outcome: 'no',
    entryPrice: 0.30,
    currentPrice: 0.25,
    shares: 250,
    pnl: -12.50,
    pnlPercent: -16.6,
  },
  {
    id: '3',
    market: 'Fed Rate Cut in June',
    category: 'Economy',
    outcome: 'yes',
    entryPrice: 0.65,
    currentPrice: 0.72,
    shares: 500,
    pnl: 35.00,
    pnlPercent: 10.7,
  },
])

// Trade history mock data
const tradeHistory = ref([
  {
    id: '1',
    market: 'Taylor Swift Album 2024',
    outcome: 'yes',
    category: 'Entertainment',
    entryPrice: 0.60,
    exitPrice: 0.85,
    profit: 45.20,
    isProfit: true,
    closedAt: '2 hours ago',
  },
  {
    id: '2',
    market: 'SpaceX Launch Success',
    outcome: 'no',
    category: 'Science',
    entryPrice: 0.15,
    exitPrice: 0.10,
    profit: -12.00,
    isProfit: false,
    closedAt: '5 hours ago',
  },
  {
    id: '3',
    market: 'GDP Growth > 2%',
    outcome: 'yes',
    category: 'Economy',
    entryPrice: 0.48,
    exitPrice: 0.55,
    profit: 15.50,
    isProfit: true,
    closedAt: '1 day ago',
  },
])

// Actions
function toggleBotStatus() {
  trader.status = trader.status === 'active' ? 'paused' : 'active'
  console.log(`Bot status changed to: ${trader.status}`)
}

function deleteBot() {
  console.log('Deleting bot:', traderName.value)
  // TODO: Add confirmation modal
}

function updateConfig() {
  console.log('Updating config:', config)
}

function closePosition(positionId: string) {
  console.log('Closing position:', positionId)
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
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
    <!-- Navbar -->
    <DashboardNavbar />

    <!-- Main content -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Traders</span>
              </li>
              <li><span class="text-slate-300 dark:text-slate-600">/</span></li>
              <li aria-current="page" class="text-sm font-medium text-slate-900 dark:text-white">
                {{ trader.name }}
              </li>
            </ol>
          </nav>

          <!-- Title -->
          <h2 class="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate flex items-center gap-3 flex-wrap">
            {{ trader.name }}
            <a
              :href="trader.polymarketUrl"
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
                trader.mode === 'mock'
                  ? 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-500/20'
                  : 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/20',
              ]"
            >
              {{ trader.mode === 'mock' ? 'Mock' : 'Live' }}
            </span>
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
                trader.status === 'active'
                  ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/20'
                  : 'bg-slate-50 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/40',
              ]"
            >
              {{ trader.status === 'active' ? 'Running' : 'Paused' }}
            </span>
          </h2>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex md:mt-0 md:ml-4 gap-3">
          <button
            type="button"
            class="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            @click="toggleBotStatus"
          >
            <span class="material-symbols-outlined mr-2 text-base">
              {{ trader.status === 'active' ? 'pause' : 'play_arrow' }}
            </span>
            {{ trader.status === 'active' ? 'Pause Bot' : 'Resume Bot' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            @click="deleteBot"
          >
            <span class="material-symbols-outlined mr-2 text-base">delete</span>
            Stop & Delete
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <!-- Total Profit -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-200 dark:border-slate-700">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-md p-3">
                <span class="material-symbols-outlined text-green-600 dark:text-green-400">paid</span>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Total Profit</dt>
                  <dd>
                    <div class="text-lg font-medium text-slate-900 dark:text-white">{{ formatCurrency(trader.totalProfit) }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-700/50 px-5 py-3">
            <div class="text-sm">
              <span class="text-green-600 font-medium">+{{ trader.profitPercent }}%</span>
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
                    <div class="text-lg font-medium text-slate-900 dark:text-white">{{ formatCurrency(trader.unrealizedPnl) }}</div>
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

        <!-- Win Rate -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-200 dark:border-slate-700">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 rounded-md p-3">
                <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">analytics</span>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Win Rate</dt>
                  <dd>
                    <div class="text-lg font-medium text-slate-900 dark:text-white">{{ trader.winRate }}%</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-700/50 px-5 py-3">
            <div class="text-sm">
              <span class="text-slate-500 dark:text-slate-400">Based on {{ trader.closedTrades }} closed trades</span>
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
                    <div class="text-lg font-medium text-slate-900 dark:text-white">{{ trader.activePositions }} Active</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-700/50 px-5 py-3">
            <div class="text-sm">
              <a href="#current-positions" class="font-medium hover:opacity-80" style="color: #2563EB;">View all positions</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart & Config Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <!-- Performance Chart -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
          <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-white mb-4">Portfolio Performance</h3>
          <div class="relative h-72 w-full">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Configuration -->
        <div class="lg:col-span-1 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
          <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-white mb-4">Configuration</h3>
          <form class="space-y-4" @submit.prevent="updateConfig">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300" for="max-bet">
                Max Bet Amount ($)
              </label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-slate-500 sm:text-sm">$</span>
                </div>
                <input
                  id="max-bet"
                  v-model.number="config.maxBet"
                  type="number"
                  class="block w-full pl-7 pr-3 py-2 sm:text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="50.00"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300" for="stop-loss">
                Stop Loss (%)
              </label>
              <div class="mt-1">
                <input
                  id="stop-loss"
                  v-model.number="config.stopLoss"
                  type="number"
                  class="block w-full px-3 py-2 sm:text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="20"
                />
              </div>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="flex-grow flex flex-col">
                <span class="text-sm font-medium text-slate-900 dark:text-white">Auto-Compound</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">Reinvest profits automatically</span>
              </span>
              <button
                type="button"
                role="switch"
                :aria-checked="config.autoCompound"
                :class="[
                  config.autoCompound ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600',
                  'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                ]"
                @click="config.autoCompound = !config.autoCompound"
              >
                <span
                  aria-hidden="true"
                  :class="[
                    config.autoCompound ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
                  ]"
                />
              </button>
            </div>
            <div class="pt-4">
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                style="background-color: #2563EB;"
              >
                Update Config
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Current Positions Table -->
      <div id="current-positions" class="mb-8">
        <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-white mb-4">
          Current Positions ({{ positions.length }})
        </h3>
        <div class="flex flex-col">
          <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div class="shadow overflow-hidden border border-slate-200 dark:border-slate-700 sm:rounded-lg">
                <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead class="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Market</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outcome</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entry Price</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Price</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shares</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unrealized PnL</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    <tr v-for="position in positions" :key="position.id">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-slate-500 dark:text-slate-400">timeline</span>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-medium text-slate-900 dark:text-white">{{ position.market }}</div>
                            <div class="text-sm text-slate-500 dark:text-slate-400">{{ position.category }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          :class="[
                            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                            position.outcome === 'yes'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                          ]"
                        >
                          {{ position.outcome === 'yes' ? 'Yes' : 'No' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        ${{ position.entryPrice.toFixed(2) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">
                        ${{ position.currentPrice.toFixed(2) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {{ position.shares }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          :class="[
                            'text-sm font-medium',
                            position.pnl >= 0 ? 'text-green-600' : 'text-red-600',
                          ]"
                        >
                          {{ position.pnl >= 0 ? '+' : '' }}${{ position.pnl.toFixed(2) }} ({{ formatPercent(position.pnlPercent) }})
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          class="hover:opacity-80"
                          style="color: #2563EB;"
                          @click="closePosition(position.id)"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trade History -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg leading-6 font-medium text-slate-900 dark:text-white">Trade History</h3>
          <button class="text-sm font-medium hover:opacity-80" style="color: #2563EB;">
            View Full History →
          </button>
        </div>
        <div class="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-md border border-slate-200 dark:border-slate-700">
          <ul role="list" class="divide-y divide-slate-200 dark:divide-slate-700">
            <li v-for="trade in tradeHistory" :key="trade.id">
              <div class="block hover:bg-slate-50 dark:hover:bg-slate-700/50 transition duration-150 ease-in-out">
                <div class="px-4 py-4 sm:px-6">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium truncate" style="color: #2563EB;">
                      Sold '{{ trade.outcome === 'yes' ? 'Yes' : 'No' }}' on "{{ trade.market }}"
                    </p>
                    <div class="ml-2 flex-shrink-0 flex">
                      <p
                        :class="[
                          'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                          trade.isProfit
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                        ]"
                      >
                        {{ trade.isProfit ? 'Profit' : 'Loss' }}: {{ formatCurrency(trade.profit) }}
                      </p>
                    </div>
                  </div>
                  <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                      <p class="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <span class="material-symbols-outlined text-sm mr-1">attach_money</span>
                        Sold at ${{ trade.exitPrice.toFixed(2) }} (Entry ${{ trade.entryPrice.toFixed(2) }})
                      </p>
                      <p class="mt-2 flex items-center text-sm text-slate-500 dark:text-slate-400 sm:mt-0 sm:ml-6">
                        <span class="material-symbols-outlined text-sm mr-1">category</span>
                        {{ trade.category }}
                      </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-slate-500 dark:text-slate-400 sm:mt-0">
                      <span class="material-symbols-outlined text-sm mr-1">schedule</span>
                      <p>Closed {{ trade.closedAt }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <DashboardFooter />
  </div>
</template>
