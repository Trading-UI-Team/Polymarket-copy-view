import mongoose, { Schema, Document } from 'mongoose'

export interface IMockTradeRecord extends Document {
    taskId: string
    side: string
    proxyWallet: string
    asset: string
    conditionId: string
    outcomeIndex?: number
    fillPrice: number
    fillSize: number
    usdcAmount: number
    slippage: number
    realizedPnl?: number
    sourceTransactionHash?: string
    sourceTimestamp?: number
    executedAt?: number
    title?: string
    slug?: string
    eventSlug?: string
    outcome?: string
}

const MockTradeRecordSchema: Schema = new Schema({
    taskId: { type: String, required: true, index: true },
    side: { type: String, required: true },
    proxyWallet: { type: String },
    asset: { type: String, required: true },
    conditionId: { type: String, required: true },
    outcomeIndex: { type: Number },
    fillPrice: { type: Number, required: true },
    fillSize: { type: Number, required: true },
    usdcAmount: { type: Number, required: true },
    slippage: { type: Number },
    realizedPnl: { type: Number },
    sourceTransactionHash: { type: String },
    sourceTimestamp: { type: Number },
    executedAt: { type: Number, index: true },
    title: { type: String },
    slug: { type: String },
    eventSlug: { type: String },
    outcome: { type: String },
})

// Note: The collection name has a typo "Recrod" to match the Telegram bot's model
export const MockTradeRecord = mongoose.models.mockTradeRecrod || mongoose.model<IMockTradeRecord>('mockTradeRecrod', MockTradeRecordSchema)
