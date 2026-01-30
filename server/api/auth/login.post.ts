export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const inputUser = String(body.username).trim()
  const inputPass = String(body.password).trim()
  const configUser = String(config.adminUsername).trim()
  const configPass = String(config.adminPassword).trim()
  
  if (
    inputUser === configUser &&
    inputPass === configPass
  ) {
    // Set encrypted session cookie
    await setUserSession(event, {
      user: {
        username: config.adminUsername
      },
      loggedInAt: new Date()
    })

    return { success: true }
  }

  throw createError({
    statusCode: 401,
    message: 'Invalid credentials'
  })
})
