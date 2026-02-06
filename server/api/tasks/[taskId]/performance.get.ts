import { connectToMongoDB } from '../../../utils/mongodb'
import { TradeRecord } from '../../../models/TradeRecord'

// Performance data point
interface PerformancePoint {
    timestamp: number
    profit: number  // Cumulative realized profit from SELL and REDEEM
}

// Aggregation result type
interface AggregatedInterval {
    _id: number      // interval timestamp
    totalPnl: number // sum of realizedPnl in this interval
}

// Time range in milliseconds
const TIME_RANGES = {
    '1D': 24 * 60 * 60 * 1000,        // 1 day
    '1W': 7 * 24 * 60 * 60 * 1000,    // 1 week
    'ALL': 0,                          // All time (no limit)
}

// Interval durations based on range
const INTERVAL_DURATIONS = {
    '1D': 60 * 60 * 1000,             // 1 hour
    '1W': 6 * 60 * 60 * 1000,         // 6 hours
    'ALL': 24 * 60 * 60 * 1000,       // 1 day
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

    // Validate range parameter
    if (!(range in TIME_RANGES)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid range. Must be one of: ${Object.keys(TIME_RANGES).join(', ')}`,
        })
    }

    // Connect to MongoDB
    await connectToMongoDB()

    // Get Redis client
    const { client } = await useRedis()

    // Fetch the task to get created date
    const taskStr = await client.hGet(TASKS_KEY, taskId)
    if (!taskStr) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Task not found',
        })
    }

    const task = JSON.parse(taskStr)
    const taskCreatedAt = task.createdAt ?? Date.now()

    // Calculate time range
    const now = Date.now()
    const rangeMs = TIME_RANGES[range as keyof typeof TIME_RANGES]
    const startTime = rangeMs > 0 ? now - rangeMs : taskCreatedAt
    const intervalMs = INTERVAL_DURATIONS[range as keyof typeof INTERVAL_DURATIONS]

    // Build match stage for aggregation
    const matchStage: Record<string, unknown> = {
        taskId,
        side: { $in: ['SELL', 'REDEEM'] }
    }
    if (rangeMs > 0) {
        matchStage.executedAt = { $gte: startTime }
    }

    // Use MongoDB Aggregation to group by time intervals
    // This is much more efficient than fetching all trades
    const aggregatedData = await TradeRecord.aggregate<AggregatedInterval>([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    // Floor executedAt to interval boundary
                    $subtract: [
                        '$executedAt',
                        { $mod: ['$executedAt', intervalMs] }
                    ]
                },
                totalPnl: { $sum: { $ifNull: ['$realizedPnl', 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ])

    // Build performance history by calculating cumulative profit
    const performanceHistory: PerformancePoint[] = []

    // Start with initial state - always start from 0
    let cumulativeProfit = 0

    // Add starting point at 0
    performanceHistory.push({
        timestamp: startTime,
        profit: 0,
    })

    // Process aggregated intervals and build cumulative history
    for (const interval of aggregatedData) {
        cumulativeProfit += interval.totalPnl

        performanceHistory.push({
            timestamp: interval._id,
            profit: cumulativeProfit,
        })
    }

    // Add current point if the last point is not recent
    const lastPoint = performanceHistory[performanceHistory.length - 1]
    if (performanceHistory.length === 0 || (lastPoint && lastPoint.timestamp < now - intervalMs)) {
        performanceHistory.push({
            timestamp: now,
            profit: cumulativeProfit,
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
    const values = performanceHistory.map(p => Number(p.profit.toFixed(2)))

    return {
        success: true,
        data: {
            labels,
            values,
            range,
            startTime,
            endTime: now,
            totalProfit: Number(cumulativeProfit.toFixed(2)),
        },
    }
})
