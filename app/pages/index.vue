<script setup lang="ts">
const title = 'Welcome to Nuxt'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
    <div class="text-center p-8">
      <h1 class="text-5xl font-bold text-white mb-4">
        {{ title }}
      </h1>
      <p class="text-xl text-purple-200 mb-8">
        Your Nuxt app with Tailwind CSS, ESLint, Prettier & TypeScript is ready!
      </p>
      <div class="flex gap-4 justify-center">
        <a
          href="https://nuxt.com"
          target="_blank"
          class="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
        >
          Nuxt Docs
        </a>
        <a
          href="https://tailwindcss.com"
          target="_blank"
          class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
        >
          Tailwind CSS
        </a>
      </div>
    </div>
  </div>
</template>
