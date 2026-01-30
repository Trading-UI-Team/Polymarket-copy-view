export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  // Redirect to home if already logged in
  if (to.path === '/login' && loggedIn.value) {
    return navigateTo('/')
  }

  // Redirect to login if not logged in
  if (to.path !== '/login' && !loggedIn.value) {
    return navigateTo('/login')
  }
})
