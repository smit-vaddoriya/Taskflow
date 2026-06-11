import Redis from 'ioredis'
import { env } from './env'

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

redis.on('error', (err) => console.error('Redis error:', err.message))
redis.on('connect', () => console.log('Redis connected'))

export async function connectRedis() {
  await redis.connect()
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  },
  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  },
  async del(key: string): Promise<void> {
    await redis.del(key)
  },
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  },
}

export const cacheKeys = {
  orgConfig: (orgId: string) => `org:${orgId}:config`,
  orgMembers: (orgId: string) => `org:${orgId}:members`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  projectBoards: (projectId: string) => `project:${projectId}:boards`,
  boardTasks: (boardId: string) => `board:${boardId}:tasks`,
  analytics: (orgId: string, type: string) => `analytics:${orgId}:${type}`,
  session: (userId: string) => `session:${userId}`,
}