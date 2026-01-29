<script setup lang="ts">
// Page meta
definePageMeta({
  layout: false,
})

useSeoMeta({
  title: 'PolyCopy - System Login',
  description: 'Sign in to your PolyCopy portfolio automation system',
})

// Form state
const email = ref('')
const password = ref('')
const isLoading = ref(false)

// Form submission
async function handleSubmit() {
  isLoading.value = true
  try {
    // TODO: Implement actual login logic
    console.log('Login attempt:', { email: email.value })
    await navigateTo('/dashboard')
  }
  finally {
    isLoading.value = false
  }
}

// Wallet connection
async function connectWallet() {
  // TODO: Implement wallet connection
  console.log('Connecting wallet...')
}
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
    <!-- Background decorations -->
    <div class="absolute inset-0 z-0">
      <div class="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-[#0B1121]" />
      <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
    </div>

    <!-- Login card -->
    <div class="w-full max-w-[420px] z-10 relative">
      <div class="bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 p-8 sm:p-10">
        <!-- Header -->
        <div class="flex flex-col items-center mb-8">
          <div class="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 dark:bg-primary/10 text-primary mb-5 ring-1 ring-blue-100 dark:ring-primary/20 shadow-sm">
            <span class="material-symbols-outlined text-[32px]">query_stats</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            PolyCopy
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            Welcome back. Sign in to your portfolio.
          </p>
        </div>

        <!-- Login form -->
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Email field -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              class="block w-full rounded-lg border-0 py-2.5 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white dark:bg-slate-800/50 transition-shadow px-3"
            >
          </div>

          <!-- Password field -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label
                for="password"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <NuxtLink
                to="/forgot-password"
                class="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Forgot password?
              </NuxtLink>
            </div>
            <input
              id="password"
              v-model="password"
              type="password"
              name="password"
              required
              placeholder="••••••••"
              class="block w-full rounded-lg border-0 py-2.5 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white dark:bg-slate-800/50 transition-shadow px-3"
            >
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="mr-2">
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </span>
            Sign In
          </button>
        </form>

        <!-- Divider -->
        <div class="relative mt-8 mb-6">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div class="relative flex justify-center">
            <span class="bg-card-light dark:bg-card-dark px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Or continue with
            </span>
          </div>
        </div>

        <!-- Wallet connect button -->
        <button
          type="button"
          class="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 group"
          @click="connectWallet"
        >
          <span class="material-symbols-outlined text-[#F6851B] group-hover:scale-110 transition-transform">
            account_balance_wallet
          </span>
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Connect Wallet
          </span>
        </button>

        <!-- Sign up link -->
        <p class="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?
          <NuxtLink
            to="/register"
            class="font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Create an account
          </NuxtLink>
        </p>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-xs text-slate-400 dark:text-slate-500">
          © 2024 PolyCopy Automation. Secure Access.
        </p>
      </div>
    </div>
  </div>
</template>
