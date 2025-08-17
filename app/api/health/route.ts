import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import { optimizedQueries } from '@/lib/api/database'
import { performanceMonitor } from '@/lib/api/monitoring'
import { withPublicApi } from '@/lib/api/middleware'

async function healthCheckHandler() {
  try {
    const startTime = Date.now()

    // Initialize database connection
    await optimizedQueries.init(true) // Use admin client for health check

    // Check database connectivity
    const dbHealthy = await optimizedQueries.healthCheck()
    const dbResponseTime = Date.now() - startTime
    
    // Get performance metrics
    const healthStatus = performanceMonitor.getHealthStatus()
    
    // Check environment variables
    const envCheck = {
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      email: !!(process.env.GMAIL_USER && process.env.GMAIL_PASS),
      admin: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
    
    // Determine overall health
    const isHealthy = dbHealthy && healthStatus.status !== 'unhealthy'
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          responseTime: dbResponseTime
        },
        api: {
          status: healthStatus.status,
          metrics: healthStatus.metrics
        },
        environment: {
          status: Object.values(envCheck).every(Boolean) ? 'healthy' : 'degraded',
          checks: envCheck
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      }
    }
    
    return createSuccessResponse(healthData)
    
  } catch (error) {
    return createInternalErrorResponse(
      'Health check failed',
      [(error as Error).message]
    )
  }
}

export const GET = withPublicApi(async () => {
  return await healthCheckHandler()
})
