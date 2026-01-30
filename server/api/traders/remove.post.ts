export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { taskId } = body

    // taskId is optional - if not provided, removes all tasks
    if (taskId !== undefined && typeof taskId !== 'string') {
        throw createError({ statusCode: 400, message: 'Invalid taskId' })
    }

    const { publishTask, subscribeNotifications } = await useRedis()

    try {
        const confirmation: any = await new Promise(async (resolve, reject) => {
            let subscription: { cleanup: () => Promise<void> } | null = null
            let isResolved = false
            const timeoutMs = 30000

            const timer = setTimeout(async () => {
                if (!isResolved) {
                    isResolved = true
                    if (subscription) await subscription.cleanup()
                    reject(createError({ statusCode: 504, message: 'Timeout waiting for backend confirmation' }))
                }
            }, timeoutMs)

            try {
                subscription = await subscribeNotifications(async (msg: any) => {
                    if (msg.event === 'task_removed') {
                        // Match by taskId if provided, otherwise accept any remove confirmation
                        if (!taskId || msg.taskId === taskId) {
                            if (!isResolved) {
                                isResolved = true
                                clearTimeout(timer)
                                if (subscription) await subscription.cleanup()
                                resolve(msg)
                            }
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

                // Publish remove action
                const payload: { action: string; taskId?: string } = { action: 'remove' }
                if (taskId) {
                    payload.taskId = taskId
                }
                await publishTask(payload)

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
