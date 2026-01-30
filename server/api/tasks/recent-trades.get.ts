import { connectToMongoDB } from '../../utils/mongodb'
import { MockTradeRecord } from '../../models/MockTradeRecord'

// Redis task key (same as in the telegram bot)
const TASKS_KEY = 'copy-polymarket:tasks'

// Trade data for the frontend
interface TradeData {
    taskId: string
    taskName: string
    mode: 'mock' | 'live'
    side: string
    title: string
    outcome: string
    usdcAmount: number
    fillPrice: number
    fillSize: number
    realizedPnl?: number
    executedAt: number
}

// CopyTask interface (minimal for trade lookup)
interface CopyTask {
    id: string
    type: 'mock' | 'live'
    url: string
}

// Extract profile name from URL
function extractProfileName(url: string): string {
    try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        return pathParts[pathParts.length - 1] || 'Unknown'
    } catch {
        return 'Unknown'
    }
}

export default defineEventHandler(async () => {
    const limit = 5 // Directly fetch 5 trades

    // Connect to MongoDB
    await connectToMongoDB()

    // Get Redis client
    const { client } = await useRedis()

    // Fetch all tasks from Redis for task name lookup
    const allTasksStr = await client.hGetAll(TASKS_KEY)
    const tasksMap = new Map<string, CopyTask>()

    for (const [key, value] of Object.entries(allTasksStr)) {
        try {
            const task = JSON.parse(value as string)
            tasksMap.set(task.id, {
                id: task.id,
                type: task.type || 'mock',
                url: task.url || '',
            })
        } catch {
            // Skip invalid task data
        }
    }

    // Fetch recent trades
    const recentTrades = await MockTradeRecord
        .find({})
        .sort({ executedAt: -1 })
        .limit(limit)
        .exec()

    // Format trade data for frontend
    const formattedTrades: TradeData[] = recentTrades.map((trade) => {
        const task = tasksMap.get(trade.taskId)
        return {
            taskId: trade.taskId,
            taskName: task ? extractProfileName(task.url) : 'Unknown',
            mode: task?.type || 'mock',
            side: trade.side,
            title: trade.title || trade.slug || trade.conditionId || 'Unknown',
            outcome: trade.outcome || '',
            usdcAmount: trade.usdcAmount ?? 0,
            fillPrice: trade.fillPrice ?? 0,
            fillSize: trade.fillSize ?? 0,
            realizedPnl: trade.realizedPnl,
            executedAt: trade.executedAt ?? 0,
        }
    })

    return {
        success: true,
        data: formattedTrades,
    }
})
