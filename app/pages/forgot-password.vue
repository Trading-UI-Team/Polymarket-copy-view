<script setup lang="ts">
useSeoMeta({
  title: 'Forgot Password - PolyCopy',
  description: 'Reset your PolyCopy password',
})

const email = ref('')
const isSubmitted = ref(false)

async function handleSubmit() {
  // TODO: Implement password reset logic
  console.log('Password reset for:', email.value)
  isSubmitted.value = true
}
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-[420px]">
      <div class="bg-card-light dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 p-8 sm:p-10">
        <div class="flex flex-col items-center mb-8">
          <div class="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 dark:bg-primary/10 text-primary mb-5">
            <span class="material-symbols-outlined text-[32px]">lock_reset</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Reset Password
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            Enter your email to receive a reset link.
          </p>
        </div>

        <div v-if="isSubmitted" class="text-center">
          <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-success text-[32px]">check_circle</span>
          </div>
          <p class="text-slate-600 dark:text-slate-400">
            If an account exists for {{ email }}, you will receive a password reset link.
          </p>
          <NuxtLink
            to="/"
            class="inline-block mt-6 text-sm font-medium text-primary hover:text-primary-hover"
          >
            Back to Sign In
          </NuxtLink>
        </div>

        <form v-else class="space-y-5" @submit.prevent="handleSubmit">
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

          <button
            type="submit"
            class="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-all"
          >
            Send Reset Link
          </button>
        </form>

        <p v-if="!isSubmitted" class="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Remember your password?
          <NuxtLink to="/" class="font-semibold text-primary hover:text-primary-hover">
            Sign In
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
