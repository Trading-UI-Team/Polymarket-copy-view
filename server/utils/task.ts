import { type IMockPosition } from '../models/MockPosition'
import { type IUserPosition } from '../models/UserPosition'
import { TradeRecord } from '../models/TradeRecord'
import { getUsdcBalance } from './balance'

export const TASKS_KEY = 'copy-polymarket:tasks'

export interface CopyTask {
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

// Trade record for the frontend
export interface TradeRecordData {
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

export function normalizeTask(task: Partial<CopyTask>): CopyTask {
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

export function extractProfileName(url: string): string {
    try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        return pathParts[pathParts.length - 1] || 'Unknown'
    } catch {
        return 'Unknown'
    }
}

export function getPositionCostBasis(position: IMockPosition | IUserPosition, size: number): number {
    if (Number.isFinite(position.totalBought) && position.totalBought > 0) {
        return position.totalBought
    }
    if (Number.isFinite(position.initialValue) && position.initialValue > 0) {
        return position.initialValue
    }
    const avgPrice = Number.isFinite(position.avgPrice) ? position.avgPrice : 0
    return avgPrice * size
}

export async function getOrderBookPriceMap(positions: (IMockPosition | IUserPosition)[]): Promise<Map<string, number>> {
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
                    console.error(`[task-util] Price API returned ${res.status} for ${asset}`)
                    return [asset, undefined] as const
                }
                const data = (await res.json()) as { price?: string }
                const price = data.price ? parseFloat(data.price) : undefined
                return [asset, price] as const
            } catch (error) {
                console.error(`[task-util] Failed to fetch price for ${asset}:`, error)
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

export function applyOrderBookPrices<T extends IMockPosition | IUserPosition>(
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

export function computePositionStats(positions: (IMockPosition | IUserPosition)[]): {
    openPositionsCount: number
    totalPositionValue: number
    totalCostBasis: number
    unrealizedPnl: number
} {
    let openPositionsCount = 0
    let totalPositionValue = 0
    let totalCostBasis = 0

    for (const pos of positions) {
        const size = typeof pos.size === 'number' ? pos.size : 0
        if (size <= 0) continue
        openPositionsCount += 1

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
        openPositionsCount,
        totalPositionValue,
        totalCostBasis,
        unrealizedPnl: totalPositionValue - totalCostBasis,
    }
}

export async function fetchLivePositions(targetAddress: string, taskId: string): Promise<IUserPosition[]> {
    if (!targetAddress) return []
    try {
        const positionsUrl = `https://data-api.polymarket.com/positions?user=${targetAddress}`
        const res = await fetch(positionsUrl)
        if (!res.ok) {
            console.error(`[task-util] Failed to fetch live positions: ${res.status}`)
            return []
        }
        const apiPositions = await res.json()
        if (!Array.isArray(apiPositions)) return []

        return apiPositions.map((pos: any) => ({
            taskId: taskId,
            asset: pos.asset,
            conditionId: pos.conditionId,
            size: Number(pos.size),
            avgPrice: Number(pos.avgPrice),
            initialValue: Number(pos.initialValue),
            currentValue: Number(pos.currentValue),
            cashPnl: Number(pos.cashPnl),
            percentPnl: Number(pos.percentPnl),
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
    } catch (error) {
        console.error('[task-util] Error fetching live positions:', error)
        return []
    }
}

export async function getTaskSummary(task: CopyTask, positions: (IMockPosition | IUserPosition)[]) {
    // 1. Get prices and apply for mock tasks
    let pricedPositions: (IMockPosition | IUserPosition)[]
    if (task.type === 'mock') {
        const priceMap = await getOrderBookPriceMap(positions)
        pricedPositions = applyOrderBookPrices(positions, priceMap)
    } else {
        pricedPositions = positions
    }

    // 2. Compute stats
    const stats = computePositionStats(pricedPositions)

    // 3. Get current balance
    let currentBalance = task.currentBalance ?? 0
    if (task.type === 'live') {
        const liveBalance = await getUsdcBalance(task.myWalletAddress || '')
        if (liveBalance >= 0) {
            currentBalance = liveBalance
        }
    }

    // 4. Calculate PnL and Equity
    const initialFinance = task.initialFinance ?? 0
    const equity = currentBalance + stats.totalPositionValue
    const totalPnl = equity - initialFinance
    const realizedPnl = currentBalance + stats.totalCostBasis - initialFinance

    return {
        currentBalance,
        pricedPositions,
        stats,
        initialFinance,
        equity,
        totalPnl,
        realizedPnl,
    }
}

export async function fetchTrades(task: CopyTask): Promise<TradeRecordData[]> {
    const recentTradesRaw = await TradeRecord.find({ taskId: task.id })
        .sort({ executedAt: -1 })
        .limit(20)
        .exec()

    return recentTradesRaw.map((trade) => ({
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
