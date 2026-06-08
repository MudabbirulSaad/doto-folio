import { createAdminClient } from '@/lib/supabase/admin'
import { performanceMonitor } from '@/lib/api/monitoring'
import { checkApplicationHealth } from '@/lib/server/application/health/health-check'
import { createSupabaseDatabaseHealthCheck } from '@/lib/server/adapters/supabase/health/database-health'

export function createHealthCheckUseCase() {
  const databaseHealth = createSupabaseDatabaseHealthCheck(createAdminClient())

  return () => checkApplicationHealth({
    isDatabaseHealthy: databaseHealth.isDatabaseHealthy,
    getApiHealthStatus: () => performanceMonitor.getHealthStatus(),
    getEnvironmentStatus: () => ({
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      email: !!(process.env.GMAIL_USER && process.env.GMAIL_PASS),
      admin: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }),
    getSystemStatus: () => ({
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    })
  })
}
