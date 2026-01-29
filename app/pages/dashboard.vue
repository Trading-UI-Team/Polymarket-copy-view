<script setup lang="ts">
import type { Portfolio } from '~/components/PortfolioCard.vue'
import type { Execution } from '~/components/ExecutionsTable.vue'

useSeoMeta({
  title: 'Dashboard - PolyCopy',
  description: 'Manage your automated copy-trading portfolios',
})

// Mock data for portfolios
const portfolios = ref<Portfolio[]>([
  {
    id: '892A',
    name: 'BigBlack',
    description: 'Polymarket Whale Tracker',
    mode: 'mock',
    status: 'active',
    isVerified: true,
    balance: 14250.00,
    positions: 5,
    pnlAllTime: 3240.50,
    unrealized: -120.00,
  },
  {
    id: '22B1',
    name: 'CryptoWiz',
    description: 'Election Markets Strategy',
    mode: 'live',
    status: 'active',
    isVerified: false,
    balance: 5620.00,
    positions: 12,
    pnlAllTime: 890.25,
    unrealized: 45.00,
  },
  {
    id: '55C9',
    name: 'AlphaSeeker',
    description: 'Sports Betting Algo',
    mode: 'live',
    status: 'paused',
    isVerified: false,
    balance: 850.00,
    positions: 0,
    pnlAllTime: -150.00,
    unrealized: 0,
  },
])

// Mock data for executions
const executions = ref<Execution[]>([
  {
    id: '1',
    profile: 'BigBlack',
    profileMode: 'mock',
    market: '2024 Election Winner',
    action: 'buy-yes',
    price: '45¢',
    time: '2 mins ago',
  },
  {
    id: '2',
    profile: 'CryptoWiz',
    profileMode: 'live',
    market: 'Bitcoin > $45k Jan',
    action: 'sell-no',
    price: '82¢',
    time: '15 mins ago',
  },
  {
    id: '3',
    profile: 'BigBlack',
    profileMode: 'mock',
    market: 'Fed Rate Cut March',
    action: 'buy-yes',
    price: '12¢',
    time: '1 hour ago',
  },
])

// Portfolio actions
function handlePause(id: string) {
  const portfolio = portfolios.value.find(p => p.id === id)
  if (portfolio) {
    portfolio.status = 'paused'
  }
}

function handleResume(id: string) {
  const portfolio = portfolios.value.find(p => p.id === id)
  if (portfolio) {
    portfolio.status = 'active'
  }
}

function handleDelete(id: string) {
  // TODO: Add confirmation modal
  portfolios.value = portfolios.value.filter(p => p.id !== id)
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

function handleCreateTrader(data: { mode: 'mock' | 'live'; form: unknown }) {
  console.log('Creating trader:', data)
  // TODO: Implement API call to create trader
}

function openGlobalSettings() {
  // TODO: Open global settings modal
  console.log('Open global settings')
}
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
    <!-- Navbar -->
    <DashboardNavbar />

    <!-- Main content -->
    <main class="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="md:flex md:items-center md:justify-between mb-8">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Active Portfolios
          </h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your automated betting strategies and track performance across mock and live environments.
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            class="inline-flex items-center rounded-md bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            @click="openGlobalSettings"
          >
            Global Settings
          </button>
        </div>
      </div>

      <!-- Portfolio grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PortfolioCard
          v-for="portfolio in portfolios"
          :key="portfolio.id"
          :portfolio="portfolio"
          @pause="handlePause"
          @resume="handleResume"
          @delete="handleDelete"
          @settings="handleSettings"
        />
        <AddProfileCard @click="handleAddProfile" />
      </div>

      <!-- Add Trader Dialog -->
      <AddTraderDialog
        v-model="showAddTraderDialog"
        @create="handleCreateTrader"
      />


      <!-- Executions table -->
      <ExecutionsTable :executions="executions" />
    </main>

    <!-- Footer -->
    <DashboardFooter />
  </div>
</template>
