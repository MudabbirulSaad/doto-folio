import { ApplicationError } from '@/lib/server/domain/errors'

export const AGENT_SCOPES = [
  'portfolio:read',
  'site-content:read',
  'site-content:update',
  'projects:read',
  'projects:create',
  'projects:update',
  'projects:delete',
  'skills:read',
  'skills:create',
  'skills:update',
  'skills:delete',
  'contact-content:read',
  'contact-content:create',
  'content-overview:read',
  'blog-posts:read',
  'blog-posts:create',
  'blog-posts:update',
  'blog-posts:delete',
  'blog-taxonomy:read',
  'blog-categories:create',
  'blog-categories:update',
  'blog-categories:delete',
  'blog-tags:create',
  'blog-tags:update',
  'blog-tags:delete',
  'blog-tools:fetch-url',
  'blog-tools:convert-markdown',
  'comments:read',
  'comments:delete',
  'contact-submissions:read',
  'contact-submissions:update',
  'contact-submissions:export',
  'metrics:read'
] as const

export type AgentScope = typeof AGENT_SCOPES[number]
export type AgentAccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired'
export type AgentActorType = 'agent' | 'admin' | 'system'

export interface AgentAccessRequest {
  id: string
  agentName: string
  toolName: string
  reason: string
  requestedScopes: AgentScope[]
  approvedScopes: AgentScope[]
  status: AgentAccessRequestStatus
  codeHash: string
  expiresAt: string
  approvedBy?: string | null
  rejectedBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface AgentToken {
  id: string
  requestId?: string | null
  agentName: string
  toolName: string
  tokenHash: string
  scopes: AgentScope[]
  expiresAt: string
  revokedAt?: string | null
  lastUsedAt?: string | null
  createdAt: string
}

export interface AuthenticatedAgent {
  id: string
  requestId?: string | null
  agentName: string
  toolName: string
  scopes: AgentScope[]
  expiresAt: string
}

export interface AgentAccessRequestRepository {
  create(input: {
    agentName: string
    toolName: string
    reason: string
    requestedScopes: AgentScope[]
    codeHash: string
    expiresAt: string
  }): Promise<AgentAccessRequest>
  findByCodeHash(codeHash: string): Promise<AgentAccessRequest | null>
  listActive(): Promise<AgentAccessRequest[]>
  findById(id: string): Promise<AgentAccessRequest | null>
  approve(id: string, input: {
    approvedScopes: AgentScope[]
    approvedBy: string
  }): Promise<AgentAccessRequest>
  reject(id: string, rejectedBy: string): Promise<AgentAccessRequest>
  markExpired(id: string): Promise<AgentAccessRequest>
}

export interface AgentTokenRepository {
  create(input: {
    requestId?: string | null
    agentName: string
    toolName: string
    tokenHash: string
    scopes: AgentScope[]
    expiresAt: string
  }): Promise<AgentToken>
  findByTokenHash(tokenHash: string): Promise<AgentToken | null>
  listActive(nowIso: string): Promise<AgentToken[]>
  revoke(id: string, revokedAt: string): Promise<AgentToken>
  touchLastUsed(id: string, lastUsedAt: string): Promise<void>
}

export interface AgentAuditRepository {
  record(event: {
    actorType: AgentActorType
    action: string
    result: 'success' | 'failure'
    agentTokenId?: string | null
    accessRequestId?: string | null
    adminUserId?: string | null
    scope?: AgentScope | null
    route?: string | null
    metadata?: Record<string, unknown>
  }): Promise<void>
}

export interface TokenHasher {
  hash(value: string): Promise<string>
}

export interface TokenGenerator {
  accessCode(): string
  bearerToken(): string
}

export interface Clock {
  now(): Date
}

export interface PortfolioContextReader {
  read(input: { scopes: AgentScope[] }): Promise<Record<string, unknown>>
}

export interface AgentAccessDependencies {
  requests: AgentAccessRequestRepository
  tokens: AgentTokenRepository
  audit: AgentAuditRepository
  hasher: TokenHasher
  generator: TokenGenerator
  clock: Clock
  portfolioContext: PortfolioContextReader
}

const REQUEST_TTL_MS = 15 * 60 * 1000
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

export function normalizeAgentScopes(scopes: string[]): AgentScope[] {
  const allowed = new Set<string>(AGENT_SCOPES)
  const normalized = [...new Set(scopes)].filter(scope => allowed.has(scope)) as AgentScope[]

  if (normalized.length === 0) {
    throw new ApplicationError('VALIDATION_ERROR', 'At least one valid scope is required')
  }

  return normalized
}

function ensurePending(request: AgentAccessRequest, now: Date) {
  if (request.status !== 'pending') {
    throw new ApplicationError('VALIDATION_ERROR', `Request is already ${request.status}`)
  }

  if (new Date(request.expiresAt).getTime() <= now.getTime()) {
    throw new ApplicationError('VALIDATION_ERROR', 'Access request has expired')
  }
}

function redactRequest(request: AgentAccessRequest) {
  const { codeHash: _codeHash, ...safeRequest } = request
  return safeRequest
}

function redactToken(token: AgentToken) {
  const { tokenHash: _tokenHash, ...safeToken } = token
  return safeToken
}

export async function createAgentAccessRequest(
  deps: AgentAccessDependencies,
  input: {
    agentName: string
    toolName: string
    reason: string
    requestedScopes: string[]
  }
) {
  const agentName = input.agentName.trim()
  const toolName = input.toolName.trim()
  const reason = input.reason.trim()

  if (agentName.length < 2) throw new ApplicationError('VALIDATION_ERROR', 'Agent name is required')
  if (toolName.length < 2) throw new ApplicationError('VALIDATION_ERROR', 'Tool name is required')
  if (reason.length < 5) throw new ApplicationError('VALIDATION_ERROR', 'Reason must describe the requested access')

  const requestedScopes = normalizeAgentScopes(input.requestedScopes)
  const code = deps.generator.accessCode()
  const codeHash = await deps.hasher.hash(code)
  const now = deps.clock.now()
  const expiresAt = new Date(now.getTime() + REQUEST_TTL_MS).toISOString()

  const request = await deps.requests.create({
    agentName,
    toolName,
    reason,
    requestedScopes,
    codeHash,
    expiresAt
  })

  await deps.audit.record({
    actorType: 'agent',
    action: 'agent_access.request.created',
    result: 'success',
    accessRequestId: request.id,
    metadata: { agentName, toolName, requestedScopes }
  })

  return {
    request: redactRequest(request),
    code,
    expiresAt
  }
}

export async function pollAgentAccessRequest(deps: AgentAccessDependencies, code: string) {
  const codeHash = await deps.hasher.hash(code.trim())
  const request = await deps.requests.findByCodeHash(codeHash)
  const now = deps.clock.now()

  if (!request) {
    throw new ApplicationError('NOT_FOUND', 'Access request was not found')
  }

  if (request.status === 'pending' && new Date(request.expiresAt).getTime() <= now.getTime()) {
    const expired = await deps.requests.markExpired(request.id)
    return { request: redactRequest(expired), token: null }
  }

  if (request.status !== 'approved') {
    return { request: redactRequest(request), token: null }
  }

  const token = deps.generator.bearerToken()
  const tokenHash = await deps.hasher.hash(token)
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString()
  const issued = await deps.tokens.create({
    requestId: request.id,
    agentName: request.agentName,
    toolName: request.toolName,
    tokenHash,
    scopes: request.approvedScopes,
    expiresAt
  })

  await deps.audit.record({
    actorType: 'system',
    action: 'agent_token.issued',
    result: 'success',
    accessRequestId: request.id,
    agentTokenId: issued.id,
    metadata: { scopes: issued.scopes }
  })

  return {
    request: redactRequest(request),
    token,
    tokenRecord: redactToken(issued)
  }
}

export async function listAgentAccessRequests(deps: AgentAccessDependencies) {
  const requests = await deps.requests.listActive()
  return requests.map(redactRequest)
}

export async function approveAgentAccessRequest(
  deps: AgentAccessDependencies,
  input: {
    id: string
    approvedScopes: string[]
    adminUserId: string
  }
) {
  const request = await deps.requests.findById(input.id)
  if (!request) throw new ApplicationError('NOT_FOUND', 'Access request was not found')

  const now = deps.clock.now()
  ensurePending(request, now)

  const approvedScopes = normalizeAgentScopes(input.approvedScopes)
  const requested = new Set(request.requestedScopes)
  const extraScopes = approvedScopes.filter(scope => !requested.has(scope))
  if (extraScopes.length > 0) {
    throw new ApplicationError('VALIDATION_ERROR', 'Approved scopes must be requested by the agent', extraScopes)
  }

  const approved = await deps.requests.approve(input.id, {
    approvedScopes,
    approvedBy: input.adminUserId
  })

  await deps.audit.record({
    actorType: 'admin',
    action: 'agent_access.request.approved',
    result: 'success',
    accessRequestId: input.id,
    adminUserId: input.adminUserId,
    metadata: { approvedScopes }
  })

  return redactRequest(approved)
}

export async function rejectAgentAccessRequest(
  deps: AgentAccessDependencies,
  input: { id: string; adminUserId: string }
) {
  const request = await deps.requests.findById(input.id)
  if (!request) throw new ApplicationError('NOT_FOUND', 'Access request was not found')

  ensurePending(request, deps.clock.now())
  const rejected = await deps.requests.reject(input.id, input.adminUserId)

  await deps.audit.record({
    actorType: 'admin',
    action: 'agent_access.request.rejected',
    result: 'success',
    accessRequestId: input.id,
    adminUserId: input.adminUserId
  })

  return redactRequest(rejected)
}

export async function authenticateAgentToken(
  deps: AgentAccessDependencies,
  bearerToken: string,
  requiredScope?: AgentScope,
  route?: string
): Promise<AuthenticatedAgent> {
  const tokenHash = await deps.hasher.hash(bearerToken)
  const token = await deps.tokens.findByTokenHash(tokenHash)
  const nowIso = deps.clock.now().toISOString()

  if (!token || token.revokedAt || new Date(token.expiresAt).getTime() <= new Date(nowIso).getTime()) {
    await deps.audit.record({
      actorType: 'agent',
      action: 'agent_token.authenticate',
      result: 'failure',
      scope: requiredScope,
      route
    })
    throw new ApplicationError('UNAUTHORIZED', 'Invalid or expired agent token')
  }

  if (requiredScope && !token.scopes.includes(requiredScope)) {
    await deps.audit.record({
      actorType: 'agent',
      action: 'agent_scope.authorize',
      result: 'failure',
      agentTokenId: token.id,
      scope: requiredScope,
      route
    })
    throw new ApplicationError('FORBIDDEN', `Agent token is missing required scope: ${requiredScope}`)
  }

  await deps.tokens.touchLastUsed(token.id, nowIso)

  return {
    id: token.id,
    requestId: token.requestId,
    agentName: token.agentName,
    toolName: token.toolName,
    scopes: token.scopes,
    expiresAt: token.expiresAt
  }
}

export async function listAgentTokens(deps: AgentAccessDependencies) {
  const tokens = await deps.tokens.listActive(deps.clock.now().toISOString())
  return tokens.map(redactToken)
}

export async function revokeAgentToken(
  deps: AgentAccessDependencies,
  input: { id: string; adminUserId: string }
) {
  const token = await deps.tokens.revoke(input.id, deps.clock.now().toISOString())
  await deps.audit.record({
    actorType: 'admin',
    action: 'agent_token.revoked',
    result: 'success',
    agentTokenId: input.id,
    adminUserId: input.adminUserId
  })
  return redactToken(token)
}

export async function getAgentContext(
  deps: AgentAccessDependencies,
  bearerToken: string
) {
  const agent = await authenticateAgentToken(deps, bearerToken)
  const context = await deps.portfolioContext.read({ scopes: agent.scopes })

  return {
    agent,
    scopes: agent.scopes,
    context
  }
}
