import { createClient } from 'redis'

const CHANNEL_NOTIFICATIONS = 'copy-polymarket:notifications'
const CHANNEL_TASKS = 'copy-polymarket:tasks:incoming'

let _pubClient: ReturnType<typeof createClient> | null = null
let _subClient: ReturnType<typeof createClient> | null = null

// Helper to create a new client
const createRedisClient = () => {
  const config = useRuntimeConfig()
  const redisUrl = config.redis?.url || 'redis://localhost:6379'
  const client = createClient({ url: redisUrl })
  client.on('error', (err) => console.error('[Redis Error]', err))
  return client
}

// Internal singleton for publishing (General commands)
const getPubClient = async () => {
  if (_pubClient?.isOpen) return _pubClient

  if (!_pubClient) {
    _pubClient = createRedisClient()
  }

  if (!_pubClient.isOpen) {
    await _pubClient.connect()
  }

  return _pubClient
}

// Internal singleton for subscription (Blocking commands)
const getSubClient = async () => {
  if (_subClient?.isOpen) return _subClient

  if (!_subClient) {
    _subClient = createRedisClient()
  }

  if (!_subClient.isOpen) {
    await _subClient.connect()
  }

  return _subClient
}

export const useRedis = async () => {
  const pubClient = await getPubClient()

  const publishTask = async (payload: any) => {
    await pubClient.publish(CHANNEL_TASKS, JSON.stringify(payload))
    console.log(`[Redis] Published task to ${CHANNEL_TASKS}`)
  }

  const subscribeNotifications = async (onMessage: (data: any) => void) => {
    const subClient = await getSubClient()
    
    // Use the shared subClient. Note that node-redis handles multiplexing for subscribe listeners
    await subClient.subscribe(CHANNEL_NOTIFICATIONS, (message) => {
      try {
        const data = JSON.parse(message)
        onMessage(data)
      } catch (err) {
        console.error('[Redis Sub] JSON Parse Error:', err)
      }
    })

    console.log(`[Redis] Subscribed to ${CHANNEL_NOTIFICATIONS}`)
    return subClient
  }

  return {
    client: pubClient,
    publishTask,
    subscribeNotifications
  }
}
