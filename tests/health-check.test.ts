import test from 'node:test'
import assert from 'node:assert/strict'
import {
  checkApplicationHealth,
  type HealthCheckPorts
} from '../lib/server/application/health/health-check'

test('checkApplicationHealth combines database, API, environment, and system status', async () => {
  const ports: HealthCheckPorts = {
    async isDatabaseHealthy() {
      return true
    },
    getApiHealthStatus() {
      return {
        status: 'healthy',
        metrics: { requests: 1 }
      }
    },
    getEnvironmentStatus() {
      return {
        supabase: true,
        email: false,
        admin: true
      }
    },
    getSystemStatus() {
      return {
        uptime: 42,
        nodeVersion: 'v-test',
        platform: 'test',
        memory: {
          used: 1,
          total: 2
        }
      }
    }
  }

  const health = await checkApplicationHealth(ports, {
    now: () => new Date('2026-06-08T00:00:00.000Z')
  })

  assert.equal(health.status, 'healthy')
  assert.equal(health.timestamp, '2026-06-08T00:00:00.000Z')
  assert.deepEqual(health.checks.environment, {
    status: 'degraded',
    checks: {
      supabase: true,
      email: false,
      admin: true
    }
  })
})
