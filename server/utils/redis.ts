import { createClient } from 'redis'

const CHANNEL_NOTIFICATIONS = 'copy-polymarket:notifications'
const CHANNEL_TASKS = 'copy-polymarket:tasks:incoming'

let _pubClient: ReturnType<typeof createClient> | null = null
let _subClient: ReturnType<typeof createClient> | null = null

// Helper to create a new client
const createRedisClient = () => {
  const config = useRuntimeConfig()
  const redisUrl = (config as any).redis?.url || 'redis://localhost:6379'
  const client = createClient({ url: redisUrl })
  ;(client as any).on('error', (err: any) => console.error('[Redis Error]', err))
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
    
    const listener = (message: string) => {
      try {
        const data = JSON.parse(message)
        onMessage(data)
      } catch (err) {
        console.error('[Redis Sub] JSON Parse Error:', err)
      }
    }

    await subClient.subscribe(CHANNEL_NOTIFICATIONS, listener)
    console.log(`[Redis] Subscribed to ${CHANNEL_NOTIFICATIONS}`)
    
    return {
      cleanup: async () => {
        await subClient.unsubscribe(CHANNEL_NOTIFICATIONS, listener)
      }
    }
  }

  return {
    client: pubClient,
    publishTask,
    subscribeNotifications
  }
}
