import { connectToMongoDB } from '../../../utils/mongodb'
import { TradeRecord } from '../../../models/TradeRecord'
import { TASKS_KEY } from '../../../utils/task'

export default defineEventHandler(async (event) => {
    const taskId = getRouterParam(event, 'taskId')
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20

    if (!taskId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Task ID is required',
        })
    }

    await connectToMongoDB()

    // Verify task exists (optional but good practice)
    const { client } = await useRedis()
    const taskExists = await client.hExists(TASKS_KEY, taskId)
    if (!taskExists) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Task not found',
        })
    }

    const skip = (page - 1) * limit

    const [trades, total] = await Promise.all([
        TradeRecord.find({ taskId })
            .sort({ executedAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
        TradeRecord.countDocuments({ taskId })
    ])

    const formattedTrades = trades.map((trade) => ({
        id: trade._id?.toString() || `${trade.taskId}-${trade.executedAt}`,
        taskId: trade.taskId,
        side: trade.side,
        asset: trade.asset,
        conditionId: trade.conditionId,
        outcomeIndex: trade.outcomeIndex ?? 0,
        fillPrice: trade.fillPrice,
        fillSize: trade.fillSize,
        usdcAmount: trade.usdcAmount,
        slippage: trade.slippage,
        realizedPnl: trade.realizedPnl ?? null,
        executedAt: trade.executedAt,
        title: trade.title || '',
        slug: trade.slug || '',
        eventSlug: trade.eventSlug || '',
        outcome: trade.outcome || '',
    }))

    return {
        success: true,
        data: formattedTrades,
        pagination: {
            page,
            limit,
            total,
            hasMore: skip + trades.length < total
        }
    }
})
