export interface ApiHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  metrics: unknown
}

export interface EnvironmentStatus {
  supabase: boolean
  email: boolean
  admin: boolean
}

export interface SystemStatus {
  uptime: number
  nodeVersion: string
  platform: string
  memory: {
    used: number
    total: number
  }
}

export interface HealthCheckPorts {
  isDatabaseHealthy(): Promise<boolean>
  getApiHealthStatus(): ApiHealthStatus
  getEnvironmentStatus(): EnvironmentStatus
  getSystemStatus(): SystemStatus
}

export async function checkApplicationHealth(
  ports: HealthCheckPorts,
  options: { now?: () => Date } = {}
) {
  const startedAt = Date.now()
  const dbHealthy = await ports.isDatabaseHealthy()
  const dbResponseTime = Date.now() - startedAt
  const api = ports.getApiHealthStatus()
  const environment = ports.getEnvironmentStatus()
  const system = ports.getSystemStatus()

  return {
    status: dbHealthy && api.status !== 'unhealthy' ? 'healthy' : 'unhealthy',
    timestamp: (options.now || (() => new Date()))().toISOString(),
    version: '1.0.0',
    uptime: system.uptime,
    checks: {
      database: {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        responseTime: dbResponseTime
      },
      api: {
        status: api.status,
        metrics: api.metrics
      },
      environment: {
        status: Object.values(environment).every(Boolean) ? 'healthy' : 'degraded',
        checks: environment
      }
    },
    system: {
      nodeVersion: system.nodeVersion,
      platform: system.platform,
      memory: system.memory
    }
  }
}
