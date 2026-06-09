import { describe, expect, it, vi } from 'vitest'
import {
  approveAdminAgentRequest,
  loadAdminAgents,
  rejectAdminAgentRequest,
  revokeAdminAgentToken,
  type AdminAgentGateway
} from '@/lib/client/application/admin/agents'

function gateway(): AdminAgentGateway {
  return {
    listRequests: vi.fn(async () => [{
      id: 'request-1',
      agentName: 'Codex',
      toolName: 'codex-cli',
      reason: 'Draft blog posts',
      requestedScopes: ['blog-posts:create'],
      approvedScopes: [],
      status: 'pending',
      expiresAt: '2026-06-09T01:00:00.000Z',
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: '2026-06-09T00:00:00.000Z'
    }]),
    approveRequest: vi.fn(async (_id, approvedScopes) => ({
      id: 'request-1',
      agentName: 'Codex',
      toolName: 'codex-cli',
      reason: 'Draft blog posts',
      requestedScopes: ['blog-posts:create'],
      approvedScopes,
      status: 'approved',
      expiresAt: '2026-06-09T01:00:00.000Z',
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: '2026-06-09T00:00:00.000Z'
    })),
    rejectRequest: vi.fn(async () => ({
      id: 'request-1',
      agentName: 'Codex',
      toolName: 'codex-cli',
      reason: 'Draft blog posts',
      requestedScopes: ['blog-posts:create'],
      approvedScopes: [],
      status: 'rejected',
      expiresAt: '2026-06-09T01:00:00.000Z',
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: '2026-06-09T00:00:00.000Z'
    })),
    listTokens: vi.fn(async () => [{
      id: 'token-1',
      requestId: 'request-1',
      agentName: 'Codex',
      toolName: 'codex-cli',
      scopes: ['blog-posts:create'],
      expiresAt: '2026-06-10T00:00:00.000Z',
      revokedAt: null,
      lastUsedAt: null,
      createdAt: '2026-06-09T00:00:00.000Z'
    }]),
    revokeToken: vi.fn(async () => ({
      id: 'token-1',
      requestId: 'request-1',
      agentName: 'Codex',
      toolName: 'codex-cli',
      scopes: ['blog-posts:create'],
      expiresAt: '2026-06-10T00:00:00.000Z',
      revokedAt: '2026-06-09T02:00:00.000Z',
      lastUsedAt: null,
      createdAt: '2026-06-09T00:00:00.000Z'
    }))
  }
}

describe('admin agents workflow', () => {
  it('loads requests and tokens together', async () => {
    const api = gateway()
    const result = await loadAdminAgents(api)

    expect(result.requests).toHaveLength(1)
    expect(result.tokens).toHaveLength(1)
  })

  it('approves, rejects, and revokes through the gateway', async () => {
    const api = gateway()

    await expect(approveAdminAgentRequest(api, 'request-1', ['blog-posts:create'])).resolves.toEqual({
      success: true,
      value: expect.objectContaining({ status: 'approved' })
    })
    expect(api.approveRequest).toHaveBeenCalledWith('request-1', ['blog-posts:create'])

    await expect(rejectAdminAgentRequest(api, 'request-1')).resolves.toEqual({
      success: true,
      value: expect.objectContaining({ status: 'rejected' })
    })

    await expect(revokeAdminAgentToken(api, 'token-1')).resolves.toEqual({
      success: true,
      value: expect.objectContaining({ revokedAt: '2026-06-09T02:00:00.000Z' })
    })
  })
})
