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
    rpcUrl: 'https://polygon-rpc.com', // Overridden by NUXT_RPC_URL
    session: {
      cookie: {
        // 在開發測試時，如果非 HTTPS 且不是 localhost，可能需要設為 false
        // 但注意：nuxt-auth-utils 在某些版本會自動處理這個
        secure: process.env.NODE_ENV === 'production' 
      }
    }
  },
})

