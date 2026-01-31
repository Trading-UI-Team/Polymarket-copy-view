import { connectToMongoDB } from '../../../utils/mongodb'
import { TradeRecord } from '../../../models/TradeRecord'

// Performance data point
interface PerformancePoint {
    timestamp: number
    equity: number
    realizedPnl: number
}

// Time range in milliseconds
const TIME_RANGES = {
    '1D': 24 * 60 * 60 * 1000,        // 1 day
    '1W': 7 * 24 * 60 * 60 * 1000,    // 1 week
    'ALL': 0,                          // All time (no limit)
}

// Redis task key
const TASKS_KEY = 'copy-polymarket:tasks'

export default defineEventHandler(async (event) => {
    // Get taskId from route params
    const taskId = getRouterParam(event, 'taskId')
    const query = getQuery(event)
    const range = (query.range as string) || 'ALL'

    if (!taskId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Task ID is required',
        })
    }

    // Connect to MongoDB
    await connectToMongoDB()

    // Get Redis client
    const { client } = await useRedis()

    // Fetch the task to get initial finance and created date
    const taskStr = await client.hGet(TASKS_KEY, taskId)
    if (!taskStr) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Task not found',
        })
    }

    const task = JSON.parse(taskStr)
    const initialFinance = task.initialFinance ?? 0
    const taskCreatedAt = task.createdAt ?? Date.now()

    // Calculate time range
    const now = Date.now()
    const rangeMs = TIME_RANGES[range as keyof typeof TIME_RANGES] ?? 0
    const startTime = rangeMs > 0 ? now - rangeMs : taskCreatedAt

    // Fetch all trades for this task within the time range, sorted by time
    const matchQuery: any = { taskId }
    if (rangeMs > 0) {
        matchQuery.executedAt = { $gte: startTime }
    }

    const trades = await TradeRecord.find(matchQuery)
        .sort({ executedAt: 1 })
        .exec()

    // Build performance history by calculating cumulative realized PnL
    const performanceHistory: PerformancePoint[] = []

    // Start with initial state
    let cumulativeRealizedPnl = 0

    // If we're filtering by time range, we need to get the starting realized PnL
    if (rangeMs > 0) {
        const priorTrades = await TradeRecord.aggregate<{ _id: null; total: number }>([
            { $match: { taskId, executedAt: { $lt: startTime }, realizedPnl: { $type: 'number' } } },
            { $group: { _id: null, total: { $sum: '$realizedPnl' } } },
        ])
        cumulativeRealizedPnl = priorTrades[0]?.total ?? 0
    }

    // Add starting point
    performanceHistory.push({
        timestamp: startTime,
        equity: initialFinance + cumulativeRealizedPnl,
        realizedPnl: cumulativeRealizedPnl,
    })

    // Group trades by time intervals for smoother chart
    // For 1D: hourly intervals
    // For 1W: 6-hour intervals
    // For ALL: daily intervals
    let intervalMs: number
    if (range === '1D') {
        intervalMs = 60 * 60 * 1000 // 1 hour
    } else if (range === '1W') {
        intervalMs = 6 * 60 * 60 * 1000 // 6 hours
    } else {
        intervalMs = 24 * 60 * 60 * 1000 // 1 day
    }

    // Process trades and aggregate by interval
    const intervalMap = new Map<number, { realizedPnl: number }>()

    for (const trade of trades) {
        const tradeTime = trade.executedAt ?? Date.now()
        const intervalStart = Math.floor(tradeTime / intervalMs) * intervalMs
        const pnl = trade.realizedPnl ?? 0

        if (intervalMap.has(intervalStart)) {
            const existing = intervalMap.get(intervalStart)!
            existing.realizedPnl += pnl
        } else {
            intervalMap.set(intervalStart, { realizedPnl: pnl })
        }
    }

    // Sort intervals and build cumulative history
    const sortedIntervals = Array.from(intervalMap.entries()).sort((a, b) => a[0] - b[0])

    for (const [timestamp, data] of sortedIntervals) {
        cumulativeRealizedPnl += data.realizedPnl

        performanceHistory.push({
            timestamp,
            equity: initialFinance + cumulativeRealizedPnl,
            realizedPnl: cumulativeRealizedPnl,
        })
    }

    // Add current point if the last point is not recent
    const currentTime = Date.now()
    const lastPoint = performanceHistory[performanceHistory.length - 1]
    if (performanceHistory.length === 0 || (lastPoint && lastPoint.timestamp < currentTime - intervalMs)) {
        performanceHistory.push({
            timestamp: currentTime,
            equity: initialFinance + cumulativeRealizedPnl,
            realizedPnl: cumulativeRealizedPnl,
        })
    }

    // Format labels based on range
    const formatLabel = (timestamp: number): string => {
        const date = new Date(timestamp)
        if (range === '1D') {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        } else if (range === '1W') {
            return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' })
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
    }

    const labels = performanceHistory.map(p => formatLabel(p.timestamp))
    const values = performanceHistory.map(p => p.equity)

    return {
        success: true,
        data: {
            labels,
            values,
            range,
            startTime,
            endTime: now,
            initialFinance,
            currentEquity: values[values.length - 1] ?? initialFinance,
        },
    }
})
