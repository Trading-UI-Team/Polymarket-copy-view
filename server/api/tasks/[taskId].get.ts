import { connectToMongoDB } from '../../utils/mongodb'
import { MockPosition, type IMockPosition } from '../../models/MockPosition'
import { UserPosition, type IUserPosition } from '../../models/UserPosition'
import { MockTradeRecord, type IMockTradeRecord } from '../../models/MockTradeRecord'

// Redis task key (same as in the telegram bot)
const TASKS_KEY = 'copy-polymarket:tasks'

// CopyTask interface (same as telegram bot)
interface CopyTask {
    id: string
    type: 'mock' | 'live'
    address: string
    myWalletAddress?: string
    url: string
    initialFinance: number
    currentBalance: number
    fixedAmount: number
    status: 'running' | 'stopped'
    createdAt: number
    privateKey?: string
}

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

// Trade record for the frontend
interface TradeRecordData {
    id: string
    taskId: string
    side: string
    asset: string
    conditionId: string
    outcomeIndex: number
    fillPrice: number
    fillSize: number
    usdcAmount: number
    slippage: number
    realizedPnl: number | null
    executedAt: number
    title: string
    slug: string
    eventSlug: string
    outcome: string
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

// Helper to get position cost basis
function getPositionCostBasis(position: IMockPosition | IUserPosition, size: number): number {
    if (Number.isFinite(position.totalBought) && position.totalBought > 0) {
        return position.totalBought
    }
    if (Number.isFinite(position.initialValue) && position.initialValue > 0) {
        return position.initialValue
    }
    const avgPrice = Number.isFinite(position.avgPrice) ? position.avgPrice : 0
    return avgPrice * size
}

// Fetch current prices from Polymarket CLOB API
async function getOrderBookPriceMap(positions: (IMockPosition | IUserPosition)[]): Promise<Map<string, number>> {
    const config = useRuntimeConfig()
    const baseUrl = config.polymarketClobUrl || 'https://clob.polymarket.com'

    const assets = Array.from(
        new Set(positions.map((pos) => pos.asset).filter((asset) => typeof asset === 'string' && asset))
    )
    if (assets.length === 0) return new Map()

    const results = await Promise.all(
        assets.map(async (asset) => {
            try {
                const url = `${baseUrl}/price?token_id=${asset}&side=sell`
                const res = await fetch(url)
                if (!res.ok) {
                    console.error(`[task detail] Price API returned ${res.status} for ${asset}`)
                    return [asset, undefined] as const
                }
                const data = (await res.json()) as { price?: string }
                const price = data.price ? parseFloat(data.price) : undefined
                return [asset, price] as const
            } catch (error) {
                console.error(`[task detail] Failed to fetch price for ${asset}:`, error)
                return [asset, undefined] as const
            }
        })
    )

    const priceMap = new Map<string, number>()
    for (const [asset, price] of results) {
        if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
            priceMap.set(asset, price)
        }
    }
    return priceMap
}

// Apply order book prices to positions
function applyOrderBookPrices<T extends IMockPosition | IUserPosition>(
    positions: T[],
    priceMap: Map<string, number>
): T[] {
    if (priceMap.size === 0) return positions

    return positions.map((position) => {
        const price = priceMap.get(position.asset)
        if (!price) return position

        const size = Number.isFinite(position.size) ? position.size : 0
        const currentValue = size * price
        const costBasis = getPositionCostBasis(position, size)
        const cashPnl = currentValue - costBasis
        const percentPnl = costBasis > 0 ? (cashPnl / costBasis) * 100 : null

        const base = typeof (position as any).toObject === 'function'
            ? (position as any).toObject()
            : { ...position }

        return {
            ...base,
            curPrice: price,
            currentValue,
            cashPnl,
            percentPnl,
        } as T
    })
}

// Compute position statistics
function computePositionStats(positions: (IMockPosition | IUserPosition)[]): {
    openPositions: number
    totalPositionValue: number
    totalCostBasis: number
    unrealizedPnl: number
} {
    let openPositions = 0
    let totalPositionValue = 0
    let totalCostBasis = 0

    for (const pos of positions) {
        const size = typeof pos.size === 'number' ? pos.size : 0
        if (size <= 0) continue
        openPositions += 1

        const currentValue = Number.isFinite(pos.currentValue)
            ? pos.currentValue
            : size * (pos.curPrice || pos.avgPrice || 0)
        const costBasis = Number.isFinite(pos.totalBought) && pos.totalBought > 0
            ? pos.totalBought
            : Number.isFinite(pos.initialValue) && pos.initialValue > 0
                ? pos.initialValue
                : (pos.avgPrice || 0) * size

        totalPositionValue += currentValue
        totalCostBasis += costBasis
    }

    return {
        openPositions,
        totalPositionValue,
        totalCostBasis,
        unrealizedPnl: totalPositionValue - totalCostBasis,
    }
}

// Extract profile name from URL
function extractProfileName(url: string): string {
    try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        // Usually the profile name is the last part of the path
        return pathParts[pathParts.length - 1] || 'Unknown'
    } catch {
        return 'Unknown'
    }
}

// Normalize task from Redis
function normalizeTask(task: Partial<CopyTask>): CopyTask {
    const myWalletAddress = task.myWalletAddress || (task as any).wallet || ''
    const base = {
        id: task.id || '',
        address: task.address || '',
        myWalletAddress,
        url: task.url || '',
        initialFinance: typeof task.initialFinance === 'number' ? task.initialFinance : 0,
        currentBalance: typeof task.currentBalance === 'number' ? task.currentBalance : 0,
        fixedAmount: typeof task.fixedAmount === 'number' ? task.fixedAmount : 0,
        createdAt: typeof task.createdAt === 'number' ? task.createdAt : Date.now(),
        status: task.status === 'stopped' ? 'stopped' : 'running',
    }

    if (task.type === 'mock') {
        return {
            ...base,
            type: 'mock',
            privateKey: task.privateKey,
        } as CopyTask
    }

    return {
        ...base,
        type: 'live',
        privateKey: task.privateKey || '',
    } as CopyTask
}

// Fetch USDC balance from Polygon RPC
async function getUsdcBalance(address: string): Promise<number> {
    const rpcUrl = 'https://polygon-rpc.com'
    const usdcAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
    // selector for balanceOf(address) is 0x70a08231
    // address padded to 64 chars
    const paddedAddress = address.replace(/^0x/, '').padStart(64, '0')
    const data = '0x70a08231' + paddedAddress

    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [{ to: usdcAddress, data }, 'latest']
            })
        })
        const json = await response.json() as any
        if (json.result) {
            const hexVal = json.result
            const val = parseInt(hexVal, 16)
            return val / 1_000_000 // USDC has 6 decimals
        }
    } catch (e) {
        console.error('[task detail] Error fetching balance:', e)
    }
    return 0
}

// Fetch live activity from Polymarket Data API
async function getLiveActivity(address: string): Promise<TradeRecordData[]> {
    try {
        const url = `https://data-api.polymarket.com/activity?user=${address}&limit=20`
        const res = await fetch(url)
        if (!res.ok) return []
        const data = await res.json() as any[]

        if (!Array.isArray(data)) return []

        return data.map((item: any) => ({
            id: item.id || `${address}-${item.timestamp}`,
            taskId: '',
            side: item.side || item.type || 'UNKNOWN',
            asset: item.asset || '',
            conditionId: item.conditionId || '',
            outcomeIndex: 0,
            fillPrice: Number(item.price || 0),
            fillSize: Number(item.size || 0),
            usdcAmount: Number(item.usdcSize || item.amount || 0),
            slippage: 0,
            realizedPnl: null,
            executedAt: item.timestamp * 1000,
            title: item.title || '',
            slug: item.slug || '',
            eventSlug: item.eventSlug || '',
            outcome: item.outcome || '',
        }))
    } catch (e) {
        console.error('[task detail] Error fetching live activity:', e)
        return []
    }
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

    // Fetch positions based on task type
    let positions: (IMockPosition | IUserPosition)[]
    if (task.type === 'mock') {
        positions = await MockPosition.find({ taskId: task.id }).exec()
    } else {
        // For live tasks, fetch real positions from Polymarket Data API
        // Use myWalletAddress (the one executing trades) if available, otherwise target address
        const targetAddress = (task.myWalletAddress && task.myWalletAddress.length > 0)
            ? task.myWalletAddress
            : task.address

        try {
            const positionsUrl = `https://data-api.polymarket.com/positions?user=${targetAddress}`
            const res = await fetch(positionsUrl)

            if (res.ok) {
                const apiPositions = await res.json()
                if (Array.isArray(apiPositions)) {
                    positions = apiPositions.map((pos: any) => ({
                        taskId: task.id,
                        asset: pos.asset,
                        conditionId: pos.conditionId,
                        size: Number(pos.size),
                        avgPrice: Number(pos.avgPrice),
                        initialValue: Number(pos.initialValue),
                        currentValue: Number(pos.currentValue),
                        cashPnl: Number(pos.cashPnl),
                        percentPnl: Number(pos.percentPnl),
                        totalBought: Number(pos.totalBought),
                        realizedPnl: Number(pos.realizedPnl),
                        curPrice: Number(pos.curPrice),
                        title: pos.title,
                        slug: pos.slug,
                        icon: pos.icon,
                        eventSlug: pos.eventSlug,
                        outcome: pos.outcome,
                        outcomeIndex: pos.outcomeIndex,
                        endDate: pos.endDate,
                    } as any))
                } else {
                    positions = []
                }
            } else {
                console.error(`[task detail] Failed to fetch live positions: ${res.status}`)
                positions = []
            }
        } catch (error) {
            console.error('[task detail] Error fetching live positions:', error)
            positions = []
        }
    }

    // Get realized PnL from trades
    let realizedPnl = 0
    if (task.type === 'mock') {
        const realizedAgg = await MockTradeRecord.aggregate<{ _id: null; total: number }>([
            { $match: { taskId: task.id, realizedPnl: { $type: 'number' } } },
            { $group: { _id: null, total: { $sum: '$realizedPnl' } } },
        ])
        realizedPnl = realizedAgg[0]?.total ?? 0
    }

    // Fetch recent trades (mock or live)
    let recentTrades: TradeRecordData[] = []

    // Check target address for live data
    const targetAddress = (task.myWalletAddress && task.myWalletAddress.length > 0)
        ? task.myWalletAddress
        : task.address

    if (task.type === 'live') {
        // Fetch live activity from API
        recentTrades = await getLiveActivity(targetAddress)
    } else {
        // Fetch mock trades from DB
        const recentTradesRaw = await MockTradeRecord.find({ taskId: task.id })
            .sort({ executedAt: -1 })
            .limit(20)
            .exec()

        recentTrades = recentTradesRaw.map((trade) => ({
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
    }

    // Fetch current prices and apply to positions
    const priceMap = await getOrderBookPriceMap(positions)
    const pricedPositions = applyOrderBookPrices(positions, priceMap)
    const positionStats = computePositionStats(pricedPositions)

    // Calculate equity and PnL
    let currentBalance = task.currentBalance ?? 0

    if (task.type === 'live') {
        // Update balance from chain for live tasks
        const liveBalance = await getUsdcBalance(targetAddress)
        // If we got a valid balance, use it. Otherwise fall back to Redis value
        if (liveBalance >= 0) {
            currentBalance = liveBalance
        }
    }

    const initialFinance = task.initialFinance ?? 0
    const equity = currentBalance + positionStats.totalPositionValue
    const totalPnl = equity - initialFinance

    // Filter open positions and sort by value
    const openPositions = pricedPositions.filter((pos) => (pos.size ?? 0) > 0)
    const sortedPositions = [...openPositions].sort((a, b) => {
        const aValue = Number.isFinite(a.currentValue)
            ? a.currentValue
            : (a.size || 0) * (a.curPrice || a.avgPrice || 0)
        const bValue = Number.isFinite(b.currentValue)
            ? b.currentValue
            : (b.size || 0) * (b.curPrice || b.avgPrice || 0)
        return bValue - aValue
    })

    // Format position data for frontend
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
        balance: currentBalance,
        positionCount: positionStats.openPositions,
        pnlAllTime: totalPnl,
        unrealized: positionStats.unrealizedPnl,
        realizedPnl,
        equity,
        initialFinance,
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
