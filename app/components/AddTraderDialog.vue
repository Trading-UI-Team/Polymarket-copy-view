<script setup lang="ts">
type TradingMode = 'mock' | 'live'

interface MockFormData {
  profileUrl: string
  amountPerTrade: number
  initialCapital: number
}

interface LiveFormData {
  profileUrl: string
  amountPerTrade: number
  walletAddress: string
  privateKey: string
}

const { modelValue = false, loading = false } = defineProps<{
  modelValue?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  create: [data: { mode: TradingMode; form: MockFormData | LiveFormData }]
}>()

// Active tab state
const activeTab = ref<TradingMode>('mock')

// Form data
const mockForm = reactive<MockFormData>({
  profileUrl: '',
  amountPerTrade: 5,
  initialCapital: 100,
})

const liveForm = reactive<LiveFormData>({
  profileUrl: '',
  amountPerTrade: 5,
  walletAddress: '',
  privateKey: '',
})

// Toggle password visibility
const showPrivateKey = ref(false)

// Methods
function closeDialog() {
  emit('update:modelValue', false)
}

function handleCreate() {
  const formData = activeTab.value === 'mock' ? { ...mockForm } : { ...liveForm }
  emit('create', { mode: activeTab.value, form: formData })
}

function resetForm() {
  mockForm.profileUrl = ''
  mockForm.amountPerTrade = 5
  mockForm.initialCapital = 100
  liveForm.profileUrl = ''
  liveForm.amountPerTrade = 5
  liveForm.walletAddress = ''
  liveForm.privateKey = ''
  activeTab.value = 'mock'
  showPrivateKey.value = false
}

// Reset form when dialog closes
watch(() => modelValue, (newVal) => {
  if (!newVal) {
    resetForm()
  }

  // Lock/unlock body scroll
  if (typeof document !== 'undefined') {
    document.body.style.overflow = newVal ? 'hidden' : ''
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm"
          @click="closeDialog"
        />

        <!-- Dialog Content -->
        <div class="relative z-10 w-full max-w-lg mx-auto animate-modal-enter">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg" style="background-color: rgba(37, 99, 235, 0.1);">
                  <span class="material-symbols-outlined" style="color: #2563EB;">person_add</span>
                </div>
                <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Add New Copy-Trader</h2>
              </div>
              <button
                class="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                @click="closeDialog"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Body with Tabs -->
            <div class="px-6 pt-6 overflow-y-auto">
              <!-- Tab Buttons -->
              <div class="flex space-x-1 rounded-lg bg-slate-100 dark:bg-slate-700 p-1 mb-6 border border-slate-200 dark:border-slate-600">
                <button
                  :class="[
                    'w-full rounded-md py-2.5 text-sm font-medium leading-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50',
                    activeTab === 'mock'
                      ? 'bg-white dark:bg-slate-600 shadow-sm text-primary'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                  ]"
                  @click="activeTab = 'mock'"
                >
                  <div class="flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-lg">science</span>
                    Mock Trading
                  </div>
                </button>
                <button
                  :class="[
                    'w-full rounded-md py-2.5 text-sm font-medium leading-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50',
                    activeTab === 'live'
                      ? 'bg-white dark:bg-slate-600 shadow-sm text-primary'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                  ]"
                  @click="activeTab = 'live'"
                >
                  <div class="flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-lg">monetization_on</span>
                    Live Trading
                  </div>
                </button>
              </div>

              <!-- Form Content -->
              <div class="pb-6">
                <!-- Mock Form -->
                <div v-show="activeTab === 'mock'" class="space-y-5">
                  <!-- Info Banner -->
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3">
                    <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-sm mt-0.5">info</span>
                    <p class="text-xs text-blue-700 dark:text-blue-300">
                      Mock mode simulates trades without using real money. Perfect for testing strategies risk-free.
                    </p>
                  </div>

                  <!-- Profile URL -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" for="mock-url">
                      Polymarket Profile URL <span class="text-red-500">*</span>
                    </label>
                    <div class="relative rounded-md shadow-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="material-symbols-outlined text-slate-400 text-lg">link</span>
                      </div>
                      <input
                        id="mock-url"
                        v-model="mockForm.profileUrl"
                        type="url"
                        class="block w-full pl-10 pr-3 py-2 sm:text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="https://polymarket.com/profile/..."
                      />
                    </div>
                  </div>

                  <!-- Capital & Amount Grid -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" for="mock-capital">
                        Initial Capital
                      </label>
                      <div class="relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-slate-500 dark:text-slate-400 sm:text-sm">$</span>
                        </div>
                        <input
                          id="mock-capital"
                          v-model.number="mockForm.initialCapital"
                          type="number"
                          class="block w-full pl-7 pr-12 py-2 sm:text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="100.00"
                        />
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span class="text-slate-500 dark:text-slate-400 text-xs">USD</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" for="mock-amount">
                        Amount per trade
                      </label>
                      <div class="relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-slate-500 dark:text-slate-400 sm:text-sm">$</span>
                        </div>
                        <input
                          id="mock-amount"
                          v-model.number="mockForm.amountPerTrade"
                          type="number"
                          class="block w-full pl-7 pr-12 py-2 sm:text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="5.00"
                        />
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span class="text-slate-500 dark:text-slate-400 text-xs">USD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Live Form -->
                <div v-show="activeTab === 'live'" class="space-y-5">
                  <!-- Warning Banner -->
                  <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-3">
                    <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-sm mt-0.5">warning</span>
                    <p class="text-xs text-amber-700 dark:text-amber-300">
                      <strong>Caution:</strong> Live mode uses real funds. Ensure your private key is secure. We encrypt keys locally before transmission.
                    </p>
                  </div>

                  <!-- Profile URL -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" for="live-url">
                      Polymarket Profile URL <span class="text-red-500">*</span>
                    </label>
                    <div class="relative rounded-md shadow-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="material-symbols-outlined text-slate-400 text-lg">link</span>
                      </div>
                      <input
                        id="live-url"
                        v-model="liveForm.profileUrl"
                        type="url"
                        class="block w-full pl-10 pr-3 py-2 sm:text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="https://polymarket.com/profile/..."
                      />
                    </div>
                  </div>

                  <!-- Amount per trade -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" for="live-amount">
                      Amount per trade
                    </label>
                    <div class="relative rounded-md shadow-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-slate-500 dark:text-slate-400 sm:text-sm">$</span>
                      </div>
                      <input
                        id="live-amount"
                        v-model.number="liveForm.amountPerTrade"
                        type="number"
                        class="block w-full pl-7 pr-12 py-2 sm:text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="5.00"
                      />
                      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span class="text-slate-500 dark:text-slate-400 text-xs">USDC</span>
                      </div>
                    </div>
                  </div>

                  <!-- Wallet Section -->
                  <div class="border-t border-slate-200 dark:border-slate-700 pt-5 mt-2">
                    <div class="space-y-5">
                      <!-- Wallet Address -->
                      <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" for="wallet-address">
                          Wallet Address (Public)
                        </label>
                        <div class="relative rounded-md shadow-sm">
                          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="material-symbols-outlined text-slate-400 text-lg">account_balance_wallet</span>
                          </div>
                          <input
                            id="wallet-address"
                            v-model="liveForm.walletAddress"
                            type="text"
                            class="block w-full pl-10 pr-3 py-2 sm:text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="0x..."
                          />
                        </div>
                      </div>

                      <!-- Private Key -->
                      <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between" for="private-key">
                          <span>Private Key</span>
                          <span class="text-xs text-slate-500 font-normal">Never shared with copy-trader</span>
                        </label>
                        <div class="relative rounded-md shadow-sm group">
                          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="material-symbols-outlined text-slate-400 text-lg group-focus-within:text-primary transition-colors">vpn_key</span>
                          </div>
                          <input
                            id="private-key"
                            v-model="liveForm.privateKey"
                            :type="showPrivateKey ? 'text' : 'password'"
                            class="block w-full pl-10 pr-10 py-2 sm:text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Paste your private key securely"
                          />
                          <button
                            type="button"
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            @click="showPrivateKey = !showPrivateKey"
                          >
                            <span class="material-symbols-outlined text-lg">
                              {{ showPrivateKey ? 'visibility_off' : 'visibility' }}
                            </span>
                          </button>
                        </div>
                        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Required for signing automated transactions on Polygon.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                @click="closeDialog"
              >
                Cancel
              </button>
              <button
                type="button"
                :disabled="loading"
                class="px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                style="background-color: #2563EB; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);"
                @click="handleCreate"
              >
                <span v-if="loading" class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span v-else class="material-symbols-outlined text-sm">check</span>
                {{ loading ? 'Creating...' : 'Create Trader' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-modal-enter {
  animation: modal-enter 0.2s ease-out forwards;
}

/* Fix primary color for text-primary utility */
.text-primary {
  color: #2563EB;
}
</style>
