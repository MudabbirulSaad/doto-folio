import test from 'node:test'
import assert from 'node:assert/strict'
import {
  approveAgentAccessRequest,
  authenticateAgentToken,
  claimAgentInvitation,
  createAgentAccessRequest,
  createAgentInvitation,
  getAgentInstructions,
  rejectAgentAccessRequest,
  revokeAgentToken,
  updateAgentTokenAccess,
  type AgentInvitation,
  type AgentAccessDependencies,
  type AgentAccessRequest,
  type AgentToken
} from '../lib/server/application/agent-access/agent-access'
import { ApplicationError } from '../lib/server/domain/errors'

function deps(): AgentAccessDependencies & {
  state: {
    requests: AgentAccessRequest[]
    invitations: AgentInvitation[]
    tokens: AgentToken[]
    audits: unknown[]
  }
} {
  const state = {
    requests: [] as AgentAccessRequest[],
    invitations: [] as AgentInvitation[],
    tokens: [] as AgentToken[],
    audits: [] as unknown[]
  }

  return {
    state,
    hasher: { async hash(value) { return `hash:${value}` } },
    generator: {
      accessCode() { return 'ABCD1234' },
      bearerToken() { return 'pa_test_token' }
    },
    clock: { now() { return new Date('2026-06-09T00:00:00.000Z') } },
    portfolioContext: { async read() { return { ok: true } } },
    audit: {
      async record(event) {
        state.audits.push(event)
      }
    },
    requests: {
      async create(input) {
        const request: AgentAccessRequest = {
          id: 'request-1',
          agentName: input.agentName,
          toolName: input.toolName,
          reason: input.reason,
          requestedScopes: input.requestedScopes,
          approvedScopes: [],
          status: 'pending',
          codeHash: input.codeHash,
          expiresAt: input.expiresAt,
          approvedBy: null,
          rejectedBy: null,
          createdAt: '2026-06-09T00:00:00.000Z',
          updatedAt: '2026-06-09T00:00:00.000Z'
        }
        state.requests.push(request)
        return request
      },
      async findByCodeHash(codeHash) {
        return state.requests.find(request => request.codeHash === codeHash) || null
      },
      async listActive() {
        return state.requests
      },
      async findById(id) {
        return state.requests.find(request => request.id === id) || null
      },
      async approve(id, input) {
        const request = state.requests.find(item => item.id === id)!
        request.status = 'approved'
        request.approvedScopes = input.approvedScopes
        request.approvedBy = input.approvedBy
        return request
      },
      async reject(id, rejectedBy) {
        const request = state.requests.find(item => item.id === id)!
        request.status = 'rejected'
        request.rejectedBy = rejectedBy
        return request
      },
      async markExpired(id) {
        const request = state.requests.find(item => item.id === id)!
        request.status = 'expired'
        return request
      }
    },
    invitations: {
      async create(input) {
        const invitation: AgentInvitation = {
          id: 'invitation-1',
          agentLabel: input.agentLabel,
          toolName: input.toolName,
          scopes: input.scopes,
          instructionsMd: input.instructionsMd,
          status: 'pending',
          codeHash: input.codeHash,
          expiresAt: input.expiresAt,
          tokenExpiresAt: input.tokenExpiresAt,
          createdBy: input.createdBy,
          claimedTokenId: null,
          claimedAt: null,
          createdAt: '2026-06-09T00:00:00.000Z',
          updatedAt: '2026-06-09T00:00:00.000Z'
        }
        state.invitations.push(invitation)
        return invitation
      },
      async findByCodeHash(codeHash) {
        return state.invitations.find(invitation => invitation.codeHash === codeHash) || null
      },
      async findById(id) {
        return state.invitations.find(invitation => invitation.id === id) || null
      },
      async findByTokenId(tokenId) {
        return state.invitations.find(invitation => invitation.claimedTokenId === tokenId) || null
      },
      async listActive() {
        return state.invitations
      },
      async markClaimed(id, input) {
        const invitation = state.invitations.find(item => item.id === id)!
        invitation.status = 'claimed'
        invitation.claimedTokenId = input.claimedTokenId
        invitation.claimedAt = input.claimedAt
        return invitation
      },
      async markExpired(id) {
        const invitation = state.invitations.find(item => item.id === id)!
        invitation.status = 'expired'
        return invitation
      },
      async revoke(id) {
        const invitation = state.invitations.find(item => item.id === id)!
        invitation.status = 'revoked'
        return invitation
      }
    },
    tokens: {
      async create(input) {
        const token: AgentToken = {
          id: 'token-1',
          requestId: input.requestId,
          invitationId: input.invitationId,
          agentName: input.agentName,
          toolName: input.toolName,
          tokenHash: input.tokenHash,
          scopes: input.scopes,
          expiresAt: input.expiresAt,
          revokedAt: null,
          lastUsedAt: null,
          createdAt: '2026-06-09T00:00:00.000Z'
        }
        state.tokens.push(token)
        return token
      },
      async findByTokenHash(tokenHash) {
        return state.tokens.find(token => token.tokenHash === tokenHash) || null
      },
      async findById(id) {
        return state.tokens.find(token => token.id === id) || null
      },
      async listActive() {
        return state.tokens
      },
      async updateAccess(id, input) {
        const token = state.tokens.find(item => item.id === id)!
        token.scopes = input.scopes
        token.expiresAt = input.expiresAt
        return token
      },
      async revoke(id, revokedAt) {
        const token = state.tokens.find(item => item.id === id)!
        token.revokedAt = revokedAt
        return token
      },
      async touchLastUsed(id, lastUsedAt) {
        const token = state.tokens.find(item => item.id === id)!
        token.lastUsedAt = lastUsedAt
      }
    }
  }
}

test('createAgentAccessRequest stores only a code hash and returns the raw code to the agent', async () => {
  const testDeps = deps()

  const result = await createAgentAccessRequest(testDeps, {
    agentName: 'Codex',
    toolName: 'codex-cli',
    reason: 'Update portfolio blog posts',
    requestedScopes: ['portfolio:read', 'blog-posts:create']
  })

  assert.equal(result.code, 'ABCD1234')
  assert.equal(testDeps.state.requests[0].codeHash, 'hash:ABCD1234')
  assert.equal('codeHash' in result.request, false)
})

test('createAgentAccessRequest accepts agents without a given name', async () => {
  const testDeps = deps()

  await createAgentAccessRequest(testDeps, {
    toolName: 'unknown-cli',
    reason: 'Read public portfolio context',
    requestedScopes: ['portfolio:read']
  })

  assert.equal(testDeps.state.requests[0].agentName, 'Agent')
})

test('approveAgentAccessRequest only allows requested scopes', async () => {
  const testDeps = deps()
  await createAgentAccessRequest(testDeps, {
    agentName: 'Codex',
    toolName: 'codex-cli',
    reason: 'Update portfolio blog posts',
    requestedScopes: ['portfolio:read']
  })

  await assert.rejects(
    () => approveAgentAccessRequest(testDeps, {
      id: 'request-1',
      approvedScopes: ['portfolio:read', 'blog-posts:delete'],
      adminUserId: 'admin-1'
    }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )
})

test('authenticateAgentToken enforces required scopes and touches last used time', async () => {
  const testDeps = deps()
  await testDeps.tokens.create({
    requestId: 'request-1',
    invitationId: null,
    agentName: 'Codex',
    toolName: 'codex-cli',
    tokenHash: 'hash:pa_test_token',
    scopes: ['blog-posts:create'],
    expiresAt: '2026-06-10T00:00:00.000Z'
  })

  const agent = await authenticateAgentToken(testDeps, 'pa_test_token', 'blog-posts:create')
  assert.equal(agent.agentName, 'Codex')
  assert.equal(testDeps.state.tokens[0].lastUsedAt, '2026-06-09T00:00:00.000Z')

  await assert.rejects(
    () => authenticateAgentToken(testDeps, 'pa_test_token', 'comments:delete'),
    (error: unknown) => error instanceof ApplicationError && error.code === 'FORBIDDEN'
  )
})

test('reject and revoke workflows write status changes', async () => {
  const testDeps = deps()
  await createAgentAccessRequest(testDeps, {
    agentName: 'Codex',
    toolName: 'codex-cli',
    reason: 'Update portfolio blog posts',
    requestedScopes: ['portfolio:read']
  })

  const rejected = await rejectAgentAccessRequest(testDeps, { id: 'request-1', adminUserId: 'admin-1' })
  assert.equal(rejected.status, 'rejected')

  await testDeps.tokens.create({
    requestId: null,
    invitationId: null,
    agentName: 'Codex',
    toolName: 'codex-cli',
    tokenHash: 'hash:pa_test_token',
    scopes: ['portfolio:read'],
    expiresAt: '2026-06-10T00:00:00.000Z'
  })

  const revoked = await revokeAgentToken(testDeps, { id: 'token-1', adminUserId: 'admin-1' })
  assert.equal(revoked.revokedAt, '2026-06-09T00:00:00.000Z')
})

test('createAgentInvitation stores only a code hash and returns the raw code once', async () => {
  const testDeps = deps()

  const result = await createAgentInvitation(testDeps, {
    agentLabel: 'Codex',
    toolName: 'codex-cli',
    scopes: ['portfolio:read'],
    instructionsMd: 'Read public context.',
    adminUserId: 'admin-1'
  })

  assert.equal(result.code, 'ABCD1234')
  assert.equal(testDeps.state.invitations[0].codeHash, 'hash:ABCD1234')
  assert.equal('codeHash' in result.invitation, false)
})

test('claimAgentInvitation issues a scoped token and prevents double claim', async () => {
  const testDeps = deps()
  await createAgentInvitation(testDeps, {
    agentLabel: 'Codex',
    toolName: 'codex-cli',
    scopes: ['portfolio:read'],
    instructionsMd: 'Use the public context.',
    adminUserId: 'admin-1'
  })

  const claimed = await claimAgentInvitation(testDeps, 'ABCD1234')
  assert.equal(claimed.token, 'pa_test_token')
  assert.equal(testDeps.state.tokens[0].invitationId, 'invitation-1')
  assert.equal(testDeps.state.invitations[0].status, 'claimed')

  await assert.rejects(
    () => claimAgentInvitation(testDeps, 'ABCD1234'),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )
})

test('getAgentInstructions returns invitation task markdown and scope-aware guidance', async () => {
  const testDeps = deps()
  await createAgentInvitation(testDeps, {
    agentLabel: 'Codex',
    toolName: 'codex-cli',
    scopes: ['comments:read', 'comments:delete'],
    instructionsMd: 'Remove obvious spam.',
    adminUserId: 'admin-1'
  })
  await claimAgentInvitation(testDeps, 'ABCD1234')

  const instructions = await getAgentInstructions(testDeps, 'pa_test_token')
  assert.match(instructions.instructionsMd, /Remove obvious spam/)
  assert.match(instructions.instructionsMd, /Comments/)
  assert.doesNotMatch(instructions.instructionsMd, /Blog Posts/)
})

test('updateAgentTokenAccess changes scopes and can make a token permanent', async () => {
  const testDeps = deps()
  await testDeps.tokens.create({
    requestId: null,
    invitationId: null,
    agentName: 'Codex',
    toolName: 'codex-cli',
    tokenHash: 'hash:pa_test_token',
    scopes: ['portfolio:read'],
    expiresAt: '2026-06-10T00:00:00.000Z'
  })

  const updated = await updateAgentTokenAccess(testDeps, {
    id: 'token-1',
    scopes: ['portfolio:read', 'blog-posts:create'],
    expiresAt: null,
    adminUserId: 'admin-1'
  })

  assert.deepEqual(updated.scopes, ['portfolio:read', 'blog-posts:create'])
  assert.equal(updated.expiresAt, null)

  const agent = await authenticateAgentToken(testDeps, 'pa_test_token', 'blog-posts:create')
  assert.equal(agent.expiresAt, null)
})
