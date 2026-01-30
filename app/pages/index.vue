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

// Confirm Delete logic
const showConfirmDelete = ref(false)
const traderToDelete = ref<string | null>(null)

function handleDelete(id: string) {
  traderToDelete.value = id
  showConfirmDelete.value = true
}

function confirmDelete() {
  if (traderToDelete.value) {
    portfolios.value = portfolios.value.filter(p => p.id !== traderToDelete.value)
    console.log('Deleted trader:', traderToDelete.value)
    traderToDelete.value = null
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
      fixAmount: data.form.amountPerTrade,
      initialAmount: data.form.initialCapital || 0,
      myWalletAddress: data.form.walletAddress,
      privateKey: data.form.privateKey
    }

    const { data: newTrader } = await $fetch('/api/traders/create', {
      method: 'POST',
      body: payload
    })

    if (newTrader) {
      portfolios.value.unshift(newTrader as unknown as Portfolio) // Add to top of list
    }
  } catch (error) {
    console.error('Failed to create trader:', error)
    alert('Failed to connect to Polymarket API or create trader.')
  } finally {
    isCreating.value = false
  }
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
            <span v-if="isCreating" class="ml-2 text-sm font-normal text-slate-500 animate-pulse">
              (Connecting to Polymarket...)
            </span>
          </h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your automated betting strategies and track performance across mock and live environments.
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
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
      </div>

      <!-- Add Trader Dialog -->
      <AddTraderDialog
        v-model="showAddTraderDialog"
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
      <ExecutionsTable :executions="executions" />
    </main>

    <!-- Footer -->
    <DashboardFooter />
  </div>
</template>
