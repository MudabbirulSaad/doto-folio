// =============================================
// API PERFORMANCE MONITORING
// =============================================

interface PerformanceMetric {
  endpoint: string
  method: string
  duration: number
  status: number
  timestamp: number
  userAgent?: string
  ip?: string
  error?: string
}

interface AggregatedMetrics {
  endpoint: string
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  p95ResponseTime: number
  p99ResponseTime: number
  lastUpdated: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private aggregatedMetrics = new Map<string, AggregatedMetrics>()
  private readonly MAX_METRICS = 10000 // Keep last 10k metrics
  private readonly AGGREGATION_INTERVAL = 60000 // 1 minute

  constructor() {
    // Aggregate metrics every minute
    setInterval(() => {
      this.aggregateMetrics()
    }, this.AGGREGATION_INTERVAL)

    // Clean old metrics every 5 minutes
    setInterval(() => {
      this.cleanOldMetrics()
    }, 5 * 60 * 1000)
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    // Log slow requests
    if (metric.duration > 5000) { // 5 seconds
      console.warn(`Slow API request detected: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`)
    }

    // Log error requests
    if (metric.status >= 500) {
      console.error(`API error: ${metric.method} ${metric.endpoint} returned ${metric.status}`, {
        duration: metric.duration,
        error: metric.error
      })
    }
  }

  private aggregateMetrics(): void {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    // Get metrics from last hour
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
    
    // Group by endpoint
    const grouped = new Map<string, PerformanceMetric[]>()
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(metric)
    })

    // Calculate aggregated metrics
    grouped.forEach((metrics, endpoint) => {
      const durations = metrics.map(m => m.duration).sort((a, b) => a - b)
      const errors = metrics.filter(m => m.status >= 400).length
      
      const aggregated: AggregatedMetrics = {
        endpoint,
        totalRequests: metrics.length,
        averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
        errorRate: (errors / metrics.length) * 100,
        p95ResponseTime: durations[Math.floor(durations.length * 0.95)] || 0,
        p99ResponseTime: durations[Math.floor(durations.length * 0.99)] || 0,
        lastUpdated: now
      }

      this.aggregatedMetrics.set(endpoint, aggregated)
    })
  }

  private cleanOldMetrics(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
  }

  getMetrics(): AggregatedMetrics[] {
    return Array.from(this.aggregatedMetrics.values())
  }

  getEndpointMetrics(endpoint: string): AggregatedMetrics | undefined {
    return this.aggregatedMetrics.get(endpoint)
  }

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: {
      totalEndpoints: number
      averageResponseTime: number
      errorRate: number
      slowEndpoints: string[]
    }
  } {
    const metrics = this.getMetrics()
    
    if (metrics.length === 0) {
      return {
        status: 'healthy',
        metrics: {
          totalEndpoints: 0,
          averageResponseTime: 0,
          errorRate: 0,
          slowEndpoints: []
        }
      }
    }

    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0)
    const weightedResponseTime = metrics.reduce((sum, m) => sum + (m.averageResponseTime * m.totalRequests), 0) / totalRequests
    const weightedErrorRate = metrics.reduce((sum, m) => sum + (m.errorRate * m.totalRequests), 0) / totalRequests
    
    const slowEndpoints = metrics
      .filter(m => m.averageResponseTime > 2000) // 2 seconds
      .map(m => m.endpoint)

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (weightedErrorRate > 10 || weightedResponseTime > 5000) {
      status = 'unhealthy'
    } else if (weightedErrorRate > 5 || weightedResponseTime > 2000 || slowEndpoints.length > 0) {
      status = 'degraded'
    }

    return {
      status,
      metrics: {
        totalEndpoints: metrics.length,
        averageResponseTime: Math.round(weightedResponseTime),
        errorRate: Math.round(weightedErrorRate * 100) / 100,
        slowEndpoints
      }
    }
  }

  // Export metrics for external monitoring systems
  exportMetrics(): string {
    const metrics = this.getMetrics()
    const health = this.getHealthStatus()
    
    return JSON.stringify({
      timestamp: Date.now(),
      health,
      endpoints: metrics
    }, null, 2)
  }
}

// =============================================
// SINGLETON INSTANCE
// =============================================

export const performanceMonitor = new PerformanceMonitor()

// =============================================
// HELPER FUNCTIONS
// =============================================

export function recordApiMetric(
  endpoint: string,
  method: string,
  duration: number,
  status: number,
  userAgent?: string,
  ip?: string,
  error?: string
): void {
  performanceMonitor.recordMetric({
    endpoint,
    method,
    duration,
    status,
    timestamp: Date.now(),
    userAgent,
    ip,
    error
  })
}

// =============================================
// ALERT SYSTEM
// =============================================

interface AlertRule {
  name: string
  condition: (metrics: AggregatedMetrics) => boolean
  message: (metrics: AggregatedMetrics) => string
  cooldown: number // milliseconds
  lastTriggered: number
}

class AlertSystem {
  private rules: AlertRule[] = [
    {
      name: 'high_error_rate',
      condition: (m) => m.errorRate > 10,
      message: (m) => `High error rate detected: ${m.endpoint} has ${m.errorRate.toFixed(2)}% error rate`,
      cooldown: 5 * 60 * 1000, // 5 minutes
      lastTriggered: 0
    },
    {
      name: 'slow_response_time',
      condition: (m) => m.averageResponseTime > 5000,
      message: (m) => `Slow response time detected: ${m.endpoint} averaging ${m.averageResponseTime.toFixed(0)}ms`,
      cooldown: 5 * 60 * 1000, // 5 minutes
      lastTriggered: 0
    },
    {
      name: 'very_slow_p99',
      condition: (m) => m.p99ResponseTime > 10000,
      message: (m) => `Very slow P99 response time: ${m.endpoint} P99 is ${m.p99ResponseTime.toFixed(0)}ms`,
      cooldown: 10 * 60 * 1000, // 10 minutes
      lastTriggered: 0
    }
  ]

  checkAlerts(): void {
    const now = Date.now()
    const metrics = performanceMonitor.getMetrics()

    metrics.forEach(metric => {
      this.rules.forEach(rule => {
        if (rule.condition(metric) && (now - rule.lastTriggered) > rule.cooldown) {
          console.warn(`ALERT: ${rule.message(metric)}`)
          rule.lastTriggered = now
          
          // In production, you would send this to your monitoring service
          // e.g., Slack, PagerDuty, email, etc.
        }
      })
    })
  }
}

export const alertSystem = new AlertSystem()

// Check alerts every minute
setInterval(() => {
  alertSystem.checkAlerts()
}, 60 * 1000)

// =============================================
// CLEANUP ON PROCESS EXIT
// =============================================

process.on('SIGTERM', () => {
  console.log('Exporting final metrics before shutdown...')
  console.log(performanceMonitor.exportMetrics())
})

process.on('SIGINT', () => {
  console.log('Exporting final metrics before shutdown...')
  console.log(performanceMonitor.exportMetrics())
})
