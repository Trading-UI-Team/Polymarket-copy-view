export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const {
        taskId,
        type,
        profile,
        fixedAmount,
        initialAmount,
        privateKey,
        myWalletAddress
    } = body

    if (!taskId) {
        throw createError({ statusCode: 400, message: 'Task ID is required' })
    }

    // Crawler logic: If profile is provided, try to scrape address again just in case, or trust existing?
    // Use simple crawler logic if profile is present.
    let scrapedAddress = null
    if (profile) {
        try {
            const controller = new AbortController()
            const fetchTimeout = setTimeout(() => controller.abort(), 5000)

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
                const userMatch = html.match(/"user":"(0x[a-fA-F0-9]{40})"/i)

                if (userMatch && userMatch[1]) {
                    scrapedAddress = userMatch[1]
                } else {
                    const addressMatches = html.match(/0x[a-fA-F0-9]{40}/g)
                    if (addressMatches && addressMatches.length > 0) {
                        const uniqueAddresses = [...new Set(addressMatches)]
                        scrapedAddress = uniqueAddresses[0]
                    }
                }
            }
        } catch (error) {
            console.error('Crawler Script Error:', error)
        }
    }

    const updateData = {
        taskId,
        type,
        address: scrapedAddress, // Might be null if crawler failed, bot should handle this or keep existing
        profile,
        fixedAmount,
        initialAmount,
        privateKey,
        myWalletAddress
    }

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
                    if (msg.event === 'task_updated' && msg.data?.id === taskId) {
                        if (!isResolved) {
                            isResolved = true
                            clearTimeout(timer)
                            if (subscription) await subscription.cleanup()
                            resolve(msg)
                        }
                    } else if (msg.event === 'task_error' && msg.data?.id === taskId) {
                        if (!isResolved) {
                            isResolved = true
                            clearTimeout(timer)
                            if (subscription) await subscription.cleanup()
                            const errMsg = msg.error || 'Backend task failed'
                            reject(createError({ statusCode: 500, message: errMsg }))
                        }
                    }
                })

                // Publish task with 'edit' action
                await publishTask({
                    action: 'edit',
                    ...updateData,
                    fixAmount: fixedAmount
                })

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
            data: confirmation
        }

    } catch (err) {
        throw err
    }
})
