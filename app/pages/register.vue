<script setup lang="ts">
useSeoMeta({
  title: 'Create Account - PolyCopy',
  description: 'Create your PolyCopy account',
})

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

async function handleSubmit() {
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match')
    return
  }
  isLoading.value = true
  try {
    // TODO: Implement registration logic
    console.log('Register:', { email: email.value })
    await navigateTo('/dashboard')
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background decorations -->
    <div class="absolute inset-0 z-0">
      <div class="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-[#0B1121]" />
      <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
    </div>

    <div class="w-full max-w-[420px] z-10">
      <div class="bg-card-light dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 p-8 sm:p-10">
        <div class="flex flex-col items-center mb-8">
          <div class="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 dark:bg-primary/10 text-primary mb-5 ring-1 ring-blue-100 dark:ring-primary/20">
            <span class="material-symbols-outlined text-[32px]">query_stats</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create Account
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            Start automating your portfolio today.
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
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
              required
              placeholder="name@example.com"
              class="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white dark:bg-slate-800/50"
            >
          </div>

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
              required
              placeholder="••••••••"
              class="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white dark:bg-slate-800/50"
            >
          </div>

          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              class="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white dark:bg-slate-800/50"
            >
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            Create Account
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?
          <NuxtLink to="/" class="font-semibold text-primary hover:text-primary-hover">
            Sign In
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
