import mongoose from 'mongoose'

let isConnected = false

export async function connectToMongoDB(): Promise<void> {
    if (isConnected) return

    const config = useRuntimeConfig()
    const mongoUrl = config.mongoUrl

    if (!mongoUrl) {
        throw new Error('NUXT_MONGO_URL is not configured')
    }

    try {
        await mongoose.connect(mongoUrl)
        isConnected = true
        console.log('✅ MongoDB connected')
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error)
        isConnected = false
        throw error
    }
}

export function getMongoConnection() {
    return mongoose.connection
}
