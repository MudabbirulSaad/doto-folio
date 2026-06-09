import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { performanceMonitor } from '@/lib/api/monitoring'
import { withScopedAuth } from '@/lib/api/middleware'

async function getMetricsHandler(context: { request: NextRequest }) {
  const { request } = context
  const url = new URL(request.url)
  const format = url.searchParams.get('format') || 'json'
  const endpoint = url.searchParams.get('endpoint')

  if (endpoint) {
    // Get metrics for specific endpoint
    const endpointMetrics = performanceMonitor.getEndpointMetrics(endpoint)
    if (!endpointMetrics) {
      return createSuccessResponse(null, 'Endpoint not found')
    }
    return createSuccessResponse(endpointMetrics)
  }

  // Get all metrics
  const metrics = performanceMonitor.getMetrics()
  const healthStatus = performanceMonitor.getHealthStatus()

  const response = {
    health: healthStatus,
    endpoints: metrics,
    summary: {
      totalEndpoints: metrics.length,
      totalRequests: metrics.reduce((sum, m) => sum + m.totalRequests, 0),
      averageResponseTime: Math.round(
        metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length || 0
      ),
      overallErrorRate: Math.round(
        (metrics.reduce((sum, m) => sum + (m.errorRate * m.totalRequests), 0) / 
         metrics.reduce((sum, m) => sum + m.totalRequests, 0) || 0) * 100
      ) / 100
    }
  }

  if (format === 'prometheus') {
    // Export in Prometheus format
    let prometheusMetrics = '# HELP api_requests_total Total number of API requests\n'
    prometheusMetrics += '# TYPE api_requests_total counter\n'
    
    metrics.forEach(metric => {
      const endpoint = metric.endpoint.replace(/[^a-zA-Z0-9_]/g, '_')
      prometheusMetrics += `api_requests_total{endpoint="${endpoint}"} ${metric.totalRequests}\n`
    })
    
    prometheusMetrics += '\n# HELP api_response_time_seconds API response time in seconds\n'
    prometheusMetrics += '# TYPE api_response_time_seconds histogram\n'
    
    metrics.forEach(metric => {
      const endpoint = metric.endpoint.replace(/[^a-zA-Z0-9_]/g, '_')
      prometheusMetrics += `api_response_time_seconds{endpoint="${endpoint}",quantile="0.95"} ${metric.p95ResponseTime / 1000}\n`
      prometheusMetrics += `api_response_time_seconds{endpoint="${endpoint}",quantile="0.99"} ${metric.p99ResponseTime / 1000}\n`
    })

    return new NextResponse(prometheusMetrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
      }
    })
  }

  return createSuccessResponse(response)
}

export const GET = withScopedAuth(getMetricsHandler, 'metrics:read')
