export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { taskId } = body

    if (!taskId || typeof taskId !== 'string') {
        throw createError({ statusCode: 400, message: 'Missing or invalid taskId' })
    }

    const { publishTask, subscribeNotifications } = await useRedis()

    try {
        const confirmation: any = await new Promise(async (resolve, reject) => {
            let subscription: { cleanup: () => Promise<void> } | null = null
            let isResolved = false
            const timeoutMs = 120000

            const timer = setTimeout(async () => {
                if (!isResolved) {
                    isResolved = true
                    if (subscription) await subscription.cleanup()
                    reject(createError({ statusCode: 504, message: 'Timeout waiting for close all positions confirmation' }))
                }
            }, timeoutMs)

            try {
                subscription = await subscribeNotifications(async (msg: any) => {
                    if (msg.event === 'all_positions_closed' && msg.taskId === taskId) {
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

                await publishTask({
                    action: 'close_all_positions',
                    taskId
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
            success: confirmation.success ?? true,
            data: confirmation
        }

    } catch (err) {
        throw err
    }
})
