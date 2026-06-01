import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Only initialize if Upstash env vars are present
// Falls back gracefully if not configured (for local dev / if using self-hosted Redis)
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute per IP
    analytics: false,
  })
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
  if (!ratelimit) return { success: true, remaining: 999 }
  const result = await ratelimit.limit(identifier)
  return { success: result.success, remaining: result.remaining }
}
