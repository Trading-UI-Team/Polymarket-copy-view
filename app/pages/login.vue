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
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const { fetch, loggedIn } = useUserSession()
const router = useRouter()

// Redirect if already logged in
if (loggedIn.value) {
  navigateTo('/')
}

// Form submission
async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value
      }
    })

    // Refresh session to update loggedIn status
    await fetch()
    
    // Redirect to home
    router.push('/')
  }
  catch (e: any) {
    errorMessage.value = e.data?.message || 'Authentication failed. Please check your credentials.'
  }
  finally {
    isLoading.value = false
  }
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
            <span class="material-symbols-outlined text-[32px]" style="color: #2563EB;">query_stats</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            PolyCopy
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            Welcome back. Sign in to your portfolio.
          </p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3">
          <span class="material-symbols-outlined text-red-600 dark:text-red-400 text-sm mt-0.5">error</span>
          <p class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
        </div>

        <!-- Login form -->
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Username field -->
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              name="username"
              required
              placeholder="Enter your username"
              class="block w-full rounded-lg border-0 py-2.5 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white dark:bg-slate-800/50 transition-shadow px-3"
            >
          </div>

          <!-- Password field -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Password
            </label>
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
            class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style="background-color: #2563EB; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);"
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
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-xs text-slate-400 dark:text-slate-500">
          © 2025 PolyCopy Automation. Secure Access.
        </p>
      </div>
    </div>
  </div>
</template>
