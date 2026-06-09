import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminAgentsPage from '@/app/admin/agents/page'
import type {
  AdminAgentAccessRequest,
  AdminAgentInvitation,
  AdminAgentToken
} from '@/lib/client/domain/admin-agents'

const loadAdminAgentsMock = vi.fn()

vi.mock('@/lib/client/adapters/http/admin-agents-api', () => ({
  createAdminAgentApiGateway: () => ({})
}))

vi.mock('@/lib/client/application/admin/agents', () => ({
  approveAdminAgentRequest: vi.fn(),
  createAdminAgentInvitation: vi.fn(),
  loadAdminAgents: (...args: unknown[]) => loadAdminAgentsMock(...args),
  rejectAdminAgentRequest: vi.fn(),
  revokeAdminAgentInvitation: vi.fn(),
  revokeAdminAgentToken: vi.fn(),
  updateAdminAgentTokenAccess: vi.fn()
}))

function request(): AdminAgentAccessRequest {
  return {
    id: 'request-1',
    agentName: 'Codex',
    toolName: 'codex-cli',
    reason: 'Help with portfolio polish',
    requestedScopes: ['portfolio:read'],
    approvedScopes: [],
    status: 'pending',
    expiresAt: '2026-06-09T01:00:00.000Z',
    createdAt: '2026-06-09T00:00:00.000Z',
    updatedAt: '2026-06-09T00:00:00.000Z'
  }
}

function invitation(): AdminAgentInvitation {
  return {
    id: 'invitation-1',
    agentLabel: 'Invited Codex',
    toolName: 'codex-cli',
    scopes: ['portfolio:read'],
    instructionsMd: 'Read context.',
    status: 'pending',
    expiresAt: '2026-06-09T00:15:00.000Z',
    tokenExpiresAt: '2026-06-10T00:00:00.000Z',
    createdBy: 'admin-1',
    claimedTokenId: null,
    claimedAt: null,
    createdAt: '2026-06-09T00:00:00.000Z',
    updatedAt: '2026-06-09T00:00:00.000Z'
  }
}

function token(): AdminAgentToken {
  return {
    id: 'token-1',
    requestId: 'request-1',
    invitationId: null,
    agentName: 'Active Codex',
    toolName: 'codex-cli',
    scopes: ['portfolio:read'],
    expiresAt: '2026-06-10T00:00:00.000Z',
    revokedAt: null,
    lastUsedAt: null,
    createdAt: '2026-06-09T00:00:00.000Z'
  }
}

describe('admin agents page', () => {
  beforeEach(() => {
    loadAdminAgentsMock.mockReset()
  })

  it('loads agent requests, invitations, and tokens on initial render', async () => {
    loadAdminAgentsMock.mockResolvedValue({
      requests: [request()],
      invitations: [invitation()],
      tokens: [token()]
    })

    render(<AdminAgentsPage />)

    expect(await screen.findByRole('heading', { name: 'Agent Access' })).toBeInTheDocument()
    expect(screen.getByText('Codex')).toBeInTheDocument()
    expect(screen.getByText('Invited Codex')).toBeInTheDocument()
    expect(screen.getByText('Active Codex')).toBeInTheDocument()
  })

  it('shows the friendly agent migration message when agent tables are missing', async () => {
    loadAdminAgentsMock.mockRejectedValue(new Error('relation agent_access_requests does not exist'))

    render(<AdminAgentsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Agent access tables are missing/)).toBeInTheDocument()
    })
  })

  it('applies scope templates and clears selected invite scopes', async () => {
    loadAdminAgentsMock.mockResolvedValue({
      requests: [],
      invitations: [],
      tokens: []
    })
    const user = userEvent.setup()

    render(<AdminAgentsPage />)

    expect(await screen.findByText('Selected: Portfolio 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Blog writer/i }))
    expect(screen.getByText('Selected: Blog Posts 3, Blog Taxonomy 5, Blog Tools 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear invite scopes' }))
    expect(screen.getByText('Selected: No scopes')).toBeInTheDocument()
  })
})
