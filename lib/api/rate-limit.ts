import { NextRequest } from 'next/server'

// =============================================
// RATE LIMITING CONFIGURATION
// =============================================

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

const RATE_LIMIT_CONFIGS = {
  contact: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3, // 3 submissions per 15 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  }
} as const

// =============================================
// IN-MEMORY RATE LIMIT STORE
// =============================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key)
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key)
      return undefined
    }
    return entry
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry)
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now()
    const existing = this.get(key)

    if (existing) {
      existing.count++
      return existing
    } else {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      }
      this.set(key, newEntry)
      return newEntry
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Global store instance
const rateLimitStore = new RateLimitStore()

// =============================================
// RATE LIMITING FUNCTIONS
// =============================================

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for production behind proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return `${ip}:${userAgent.slice(0, 50)}`
}

export function rateLimit(
  request: NextRequest,
  configKey: keyof typeof RATE_LIMIT_CONFIGS
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[configKey]
  const clientId = getClientIdentifier(request)
  const key = `${configKey}:${clientId}`

  const entry = rateLimitStore.increment(key, config.windowMs)
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const success = entry.count <= config.maxRequests

  return {
    success,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: success ? undefined : Math.ceil((entry.resetTime - Date.now()) / 1000)
  }
}

// =============================================
// MIDDLEWARE HELPERS
// =============================================

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
  }

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }

  return headers
}

// =============================================
// SECURITY HEADERS
// =============================================

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

// =============================================
// CORS CONFIGURATION
// =============================================

export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'https://mudabbirulsaad.com',
    'https://www.mudabbirulsaad.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
  ]

  const isAllowedOrigin = origin && allowedOrigins.includes(origin)

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://mudabbirulsaad.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin'
  }
}

// =============================================
// CLEANUP ON PROCESS EXIT
// =============================================

process.on('SIGTERM', () => {
  rateLimitStore.destroy()
})

process.on('SIGINT', () => {
  rateLimitStore.destroy()
})
