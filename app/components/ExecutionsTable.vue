<script setup lang="ts">
export interface Execution {
  id: string
  profile: string
  profileMode: 'mock' | 'live'
  market: string
  action: 'buy-yes' | 'buy-no' | 'sell-yes' | 'sell-no'
  price: string
  time: string
}

const { executions } = defineProps<{
  executions: Execution[]
}>()

function getActionColor(action: Execution['action']): string {
  if (action.includes('buy')) return 'text-success'
  return 'text-danger'
}

function getActionLabel(action: Execution['action']): string {
  const labels: Record<Execution['action'], string> = {
    'buy-yes': 'Buy YES',
    'buy-no': 'Buy NO',
    'sell-yes': 'Sell YES',
    'sell-no': 'Sell NO',
  }
  return labels[action]
}

function getModeColor(mode: Execution['profileMode']): string {
  return mode === 'mock' ? 'bg-warning' : 'bg-success'
}
</script>

<template>
  <div class="mt-10">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
      Recent Executions
    </h3>
    <div class="bg-white dark:bg-card-dark shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 rounded-xl overflow-hidden w-full max-w-full">
      <!-- Empty State -->
      <div v-if="executions.length === 0" class="px-6 py-12 text-center">
        <span class="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 mb-2">history</span>
        <p class="text-sm text-slate-500 dark:text-slate-400">No recent executions yet</p>
      </div>
      
      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-white sm:pl-6">
                Profile
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">
                Market
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">
                Action
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">
                Price
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">
                Time
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-card-dark">
            <tr v-for="execution in executions" :key="execution.id">
              <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 dark:text-white sm:pl-6">
                <div class="flex items-center">
                  <div :class="['h-2 w-2 rounded-full mr-2', getModeColor(execution.profileMode)]" />
                  {{ execution.profile }}
                </div>
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                {{ execution.market }}
              </td>
              <td :class="['whitespace-nowrap px-3 py-4 text-sm', getActionColor(execution.action)]">
                {{ getActionLabel(execution.action) }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                {{ execution.price }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                {{ execution.time }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
