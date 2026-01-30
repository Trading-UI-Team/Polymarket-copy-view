// https://nuxt.com/docs/api/configuration/nuxt-config
// Force rebuild timestamp: 2026-01-30
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    'nuxt-auth-utils',
  ],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  runtimeConfig: {
    redis: {
      url: '' // Overridden by NUXT_REDIS_URL
    },
    mongoUrl: '', // Overridden by NUXT_MONGO_URL
    polymarketClobUrl: 'https://clob.polymarket.com', // Overridden by NUXT_POLYMARKET_CLOB_URL
    adminUsername: '', // Overridden by NUXT_ADMIN_USERNAME
    adminPassword: '', // Overridden by NUXT_ADMIN_PASSWORD
  },
})

