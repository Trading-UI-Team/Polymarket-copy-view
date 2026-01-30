export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { 
    type,
    profile, 
    fixedAmount, 
    initialAmount, 
    privateKey, 
    myWalletAddress 
  } = body

  // 1. Crawler/Fetcher Logic: Fetch HTML and extract Address via Regex
  let scrapedAddress = null
  
  try {
    const controller = new AbortController()
    const fetchTimeout = setTimeout(() => controller.abort(), 5000) // 5s timeout for scraping

    const response = await fetch(profile, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    })
    clearTimeout(fetchTimeout)

    if (response.ok) {
      const html = await response.text()
      
      // Pattern 1: Look for specific JSON key "user":"0x..." (Highest confidence)
      const userMatch = html.match(/"user":"(0x[a-fA-F0-9]{40})"/i)
      
      if (userMatch && userMatch[1]) {
        scrapedAddress = userMatch[1]
        console.log('Crawler found precise user address:', scrapedAddress)
      } else {
        // Pattern 2: Fallback to finding any Ethereum address
        const addressMatches = html.match(/0x[a-fA-F0-9]{40}/g)
        if (addressMatches && addressMatches.length > 0) {
          const uniqueAddresses = [...new Set(addressMatches)]
          scrapedAddress = uniqueAddresses[0]
          console.log('Crawler found fallback address:', scrapedAddress)
        }
      }
    } else {
      console.warn('Failed to fetch from Profile URL', response.status)
    }
  } catch (error) {
    console.error('Crawler Script Error:', error)
  }

  // 2. Construct Trader Object
  const newTrader = {
    type,
    address: scrapedAddress,
    profile,
    fixedAmount,
    initialAmount,
    privateKey,
    myWalletAddress
  }

  // connect redis: use env REDIS_URL

  if (scrapedAddress) {
    const { publishTask, subscribeNotifications } = await useRedis()
    
    try {
      // Wait for backend confirmation
      const confirmation: any = await new Promise(async (resolve, reject) => {
        let subscription: { cleanup: () => Promise<void> } | null = null
        let isResolved = false
        const timeoutMs = 30000 // 30 seconds wait time

        const timer = setTimeout(async () => {
          if (!isResolved) {
            isResolved = true
            if (subscription) await subscription.cleanup()
            reject(createError({ statusCode: 504, message: 'Timeout waiting for backend confirmation' }))
          }
        }, timeoutMs)

        try {
          // Subscribe to notifications channel
          subscription = await subscribeNotifications(async (msg: any) => {
            // Match response by address OR profile (case-insensitive)
            if (msg.event === 'task_created') {
              if (!isResolved) {
                isResolved = true
                clearTimeout(timer)
                if (subscription) await subscription.cleanup()
                resolve(msg)
              }
            } else if (msg.event === 'task_error') {
              if (!isResolved) {
                isResolved = true
                clearTimeout(timer)
                if (subscription) await subscription.cleanup()
                const errMsg = msg.error || 'Backend task failed'
                reject(createError({ statusCode: 500, message: errMsg }))
              }
            }
          })

          // Publish task with explicit profile and fixAmount
          const taskPayload = {
            ...newTrader,
            address: scrapedAddress,
            profile: profile,
            fixAmount: fixedAmount
          }
          await publishTask(taskPayload)

        } catch (e) {
          if (!isResolved) {
            isResolved = true
            clearTimeout(timer)
            if (subscription) await subscription.cleanup()
            reject(e)
          }
        }
      })

      return {
        success: true,
        data: confirmation // Return the raw message from backend
      }

    } catch (err) {
      // Propagate error to frontend
      throw err
    }
  }

  // Fallback for cases where we didn't wait for backend (e.g. no scraped address or mock mode handling?)
  return {
    success: true,
    data: newTrader
  }
})
