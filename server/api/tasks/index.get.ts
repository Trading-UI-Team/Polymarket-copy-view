import { connectToMongoDB } from '../../utils/mongodb'
import { MockPosition } from '../../models/MockPosition'
import {
    TASKS_KEY,
    type CopyTask,
    normalizeTask,
    extractProfileName,
    fetchLivePositions,
    getTaskSummary
} from '../../utils/task'

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
            // 1. Fetch positions based on task type
            let positions: any[]
            if (task.type === 'mock') {
                positions = await MockPosition.find({ taskId: task.id }).exec()
            } else {
                positions = await fetchLivePositions(task.myWalletAddress || '', task.id)
            }

            // 2. Get summary data using utility
            const summary = await getTaskSummary(task, positions)

            return {
                id: task.id,
                name: extractProfileName(task.url),
                description: `Copying ${task.address.slice(0, 6)}...${task.address.slice(-4)}`,
                mode: task.type,
                status: task.status === 'running' ? 'active' : 'paused',
                isVerified: false,
                balance: summary.currentBalance,
                positions: summary.stats.openPositionsCount,
                pnlAllTime: summary.totalPnl,
                unrealized: summary.stats.unrealizedPnl,
                realizedPnl: summary.realizedPnl,
                equity: summary.equity,
                initialFinance: summary.initialFinance,
                fixedAmount: task.fixedAmount,
                address: task.address,
                profileUrl: task.url,
                createdAt: task.createdAt,
            }
        })
    )

    return {
        success: true,
        data: portfolios,
    }
})

