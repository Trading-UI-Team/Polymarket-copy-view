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

// Portfolio data for the frontend
interface PortfolioData {
    id: string
    name: string
    description: string
    mode: 'mock' | 'live'
    status: 'active' | 'paused'
    isVerified: boolean
    balance: number
    positions: number
    pnlAllTime: number
    unrealized: number
    realizedPnl: number
    equity: number
    initialFinance: number
    fixedAmount: number
    address: string
    profileUrl: string
    createdAt: number
    topPositions: PositionData[]
}

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
                    console.error(`[tasks] Price API returned ${res.status} for ${asset}`)
                    return [asset, undefined] as const
                }
                const data = (await res.json()) as { price?: string }
                const price = data.price ? parseFloat(data.price) : undefined
                return [asset, price] as const
            } catch (error) {
                console.error(`[tasks] Failed to fetch price for ${asset}:`, error)
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
            return val / 1_000_000
        }
    } catch (e) {
        console.error('[tasks] Error fetching balance:', e)
    }
    return 0
}

export default defineEventHandler(async () => {
    // Connect to MongoDB
    await connectToMongoDB()

    // Get Redis client (using existing utility)
    const { client } = await useRedis()

    // Fetch all tasks from Redis
    const allTasksStr = await client.hGetAll(TASKS_KEY)
    const tasks: CopyTask[] = Object.values(allTasksStr).map((t) => normalizeTask(JSON.parse(t as string)))

    // Build portfolio data for each task
    const portfolios: PortfolioData[] = await Promise.all(
        tasks.map(async (task): Promise<PortfolioData> => {
            // Fetch positions based on task type
            let positions: (IMockPosition | IUserPosition)[]
            let realizedPnl = 0

            if (task.type === 'mock') {
                positions = await MockPosition.find({ taskId: task.id }).exec()

                // Get realized PnL from trades for mock
                const realizedAgg = await MockTradeRecord.aggregate<{ _id: null; total: number }>([
                    { $match: { taskId: task.id, realizedPnl: { $type: 'number' } } },
                    { $group: { _id: null, total: { $sum: '$realizedPnl' } } },
                ])
                realizedPnl = realizedAgg[0]?.total ?? 0
            } else {
                // Live task: fetch from API
                const targetAddress = (task.myWalletAddress && task.myWalletAddress.length > 0)
                    ? task.myWalletAddress
                    : task.address

                try {
                    const positionsUrl = `https://data-api.polymarket.com/positions?user=${targetAddress}`
                    const res = await fetch(positionsUrl)
                    if (res.ok) {
                        const apiPositions = await res.json()
                        if (Array.isArray(apiPositions)) {
                            positions = apiPositions.map((pos: any) => {
                                const size = Number(pos.size)
                                const avgPrice = Number(pos.avgPrice)
                                const currentValue = Number(pos.currentValue)
                                // Force calculation of Cost Basis using avgPrice ONLY
                                const costBasis = size * avgPrice
                                // Recalculate PnL to be consistent
                                const cashPnl = currentValue - costBasis
                                const percentPnl = costBasis > 0 ? (cashPnl / costBasis) * 100 : 0

                                return {
                                    taskId: task.id,
                                    asset: pos.asset,
                                    conditionId: pos.conditionId,
                                    size: size,
                                    avgPrice: avgPrice,
                                    currentValue: currentValue,
                                    cashPnl: cashPnl,
                                    percentPnl: percentPnl,
                                    realizedPnl: Number(pos.realizedPnl),
                                    curPrice: Number(pos.curPrice),
                                    title: pos.title,
                                    slug: pos.slug,
                                    icon: pos.icon,
                                    eventSlug: pos.eventSlug,
                                    outcome: pos.outcome,
                                    outcomeIndex: pos.outcomeIndex,
                                    endDate: pos.endDate,
                                } as any
                            })
                        } else {
                            positions = []
                        }
                    } else {
                        positions = []
                    }
                } catch (error) {
                    console.error('[tasks] Error fetching live positions:', error)
                    positions = []
                }
                realizedPnl = 0 // TODO: Calculate realized from live trades if needed
            }

            // Fetch current prices and apply to positions
            const priceMap = await getOrderBookPriceMap(positions)
            const pricedPositions = applyOrderBookPrices(positions, priceMap)
            const positionStats = computePositionStats(pricedPositions)

            // Calculate equity and PnL
            let currentBalance = task.currentBalance ?? 0
            if (task.type === 'live') {
                const targetAddress = (task.myWalletAddress && task.myWalletAddress.length > 0)
                    ? task.myWalletAddress
                    : task.address
                const liveBalance = await getUsdcBalance(targetAddress)
                if (liveBalance >= 0) {
                    currentBalance = liveBalance
                }
            }

            const initialFinance = task.initialFinance ?? 0
            const equity = currentBalance + positionStats.totalPositionValue
            const totalPnl = equity - initialFinance

            // Filter open positions and get top 5
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
            const topPositions = sortedPositions.slice(0, 5)

            // Format position data for frontend
            const formattedPositions: PositionData[] = topPositions.map((pos) => ({
                title: pos.title || pos.slug || pos.conditionId || 'Unknown',
                outcome: pos.outcome || '',
                size: pos.size ?? 0,
                avgPrice: pos.avgPrice ?? 0,
                curPrice: pos.curPrice ?? pos.avgPrice ?? 0,
                currentValue: pos.currentValue ?? 0,
                cashPnl: pos.cashPnl ?? 0,
                percentPnl: Number.isFinite(pos.percentPnl) ? pos.percentPnl : null,
                asset: pos.asset,
            }))



            return {
                id: task.id,
                name: extractProfileName(task.url),
                description: `Copying ${task.address.slice(0, 6)}...${task.address.slice(-4)}`,
                mode: task.type,
                status: task.status === 'running' ? 'active' : 'paused',
                isVerified: false,
                balance: currentBalance,
                positions: positionStats.openPositions,
                pnlAllTime: totalPnl,
                unrealized: positionStats.unrealizedPnl,
                realizedPnl,
                equity,
                initialFinance,
                fixedAmount: task.fixedAmount,
                address: task.address,
                profileUrl: task.url,
                createdAt: task.createdAt,
                topPositions: formattedPositions,
            }
        })
    )

    return {
        success: true,
        data: portfolios,
    }
})
