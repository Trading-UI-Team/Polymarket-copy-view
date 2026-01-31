import { connectToMongoDB } from '../../utils/mongodb'
import { MockPosition } from '../../models/MockPosition'
import {
    TASKS_KEY,
    type CopyTask,
    type TradeRecordData,
    normalizeTask,
    extractProfileName,
    fetchLivePositions,
    getTaskSummary,
    fetchTrades
} from '../../utils/task'

// Position data for the frontend
interface PositionData {
    title: string
    outcome: string
    size: number
    avgPrice: number
    curPrice: number
    currentValue: number
    cashPnl: number
    percentPnl: number | null
    asset: string
    conditionId: string
    slug: string
    eventSlug: string
    icon: string
    endDate: string
    realizedPnl: number
}

// Task detail response for the frontend
interface TaskDetailResponse {
    id: string
    name: string
    description: string
    mode: 'mock' | 'live'
    status: 'active' | 'paused'
    isVerified: boolean
    balance: number
    positionCount: number
    pnlAllTime: number
    unrealized: number
    realizedPnl: number
    equity: number
    initialFinance: number
    fixedAmount: number
    address: string
    myWalletAddress: string
    profileUrl: string
    createdAt: number
    positions: PositionData[]
    recentTrades: TradeRecordData[]
}

export default defineEventHandler(async (event) => {
    // Get taskId from route params
    const taskId = getRouterParam(event, 'taskId')

    if (!taskId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Task ID is required',
        })
    }

    // Connect to MongoDB
    await connectToMongoDB()

    // Get Redis client (using existing utility)
    const { client } = await useRedis()

    // Fetch the specific task from Redis
    const taskStr = await client.hGet(TASKS_KEY, taskId)

    if (!taskStr) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Task not found',
        })
    }

    const task = normalizeTask(JSON.parse(taskStr))

    // 1. Fetch positions based on task type
    let positions: any[]
    if (task.type === 'mock') {
        positions = await MockPosition.find({ taskId: task.id }).exec()
    } else {
        positions = await fetchLivePositions(task.myWalletAddress || '', task.id)
    }

    // 2. Fetch recent trades (mock or live)
    const recentTrades = await fetchTrades(task)

    // 3. Get summary data using utility
    const summary = await getTaskSummary(task, positions)

    // 4. Format position data for frontend
    const openPositions = summary.pricedPositions.filter((pos) => (pos.size ?? 0) > 0)
    const sortedPositions = [...openPositions].sort((a, b) => {
        const aValue = a.currentValue ?? (a.size || 0) * (a.curPrice || a.avgPrice || 0)
        const bValue = b.currentValue ?? (b.size || 0) * (b.curPrice || b.avgPrice || 0)
        return bValue - aValue
    })

    const formattedPositions: PositionData[] = sortedPositions.map((pos) => ({
        title: pos.title || pos.slug || pos.conditionId || 'Unknown',
        outcome: pos.outcome || '',
        size: pos.size ?? 0,
        avgPrice: pos.avgPrice ?? 0,
        curPrice: pos.curPrice ?? pos.avgPrice ?? 0,
        currentValue: pos.currentValue ?? 0,
        cashPnl: pos.cashPnl ?? 0,
        percentPnl: Number.isFinite(pos.percentPnl) ? pos.percentPnl : null,
        asset: pos.asset,
        conditionId: pos.conditionId,
        slug: pos.slug || '',
        eventSlug: pos.eventSlug || '',
        icon: pos.icon || '',
        endDate: pos.endDate || '',
        realizedPnl: pos.realizedPnl ?? 0,
    }))

    const response: TaskDetailResponse = {
        id: task.id,
        name: extractProfileName(task.url),
        description: `Copying ${task.address.slice(0, 6)}...${task.address.slice(-4)}`,
        mode: task.type,
        status: task.status === 'running' ? 'active' : 'paused',
        isVerified: false,
        balance: summary.currentBalance,
        positionCount: summary.stats.openPositionsCount,
        pnlAllTime: summary.totalPnl,
        unrealized: summary.stats.unrealizedPnl,
        realizedPnl: summary.realizedPnl,
        equity: summary.equity,
        initialFinance: summary.initialFinance,
        fixedAmount: task.fixedAmount,
        address: task.address,
        myWalletAddress: task.myWalletAddress || '',
        profileUrl: task.url,
        createdAt: task.createdAt,
        positions: formattedPositions,
        recentTrades,
    }

    return {
        success: true,
        data: response,
    }
})


