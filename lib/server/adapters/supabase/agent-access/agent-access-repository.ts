import { ApplicationError } from '@/lib/server/domain/errors'
import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type {
  AgentAccessRequest,
  AgentAccessRequestRepository,
  AgentAuditRepository,
  AgentScope,
  AgentToken,
  AgentTokenRepository
} from '@/lib/server/application/agent-access/agent-access'

function databaseError(message: string, error: { message: string } | null): never {
  throw new ApplicationError('DATABASE_ERROR', message, error ? [error.message] : undefined)
}

function requestFromRow(row: any): AgentAccessRequest {
  return {
    id: row.id,
    agentName: row.agent_name,
    toolName: row.tool_name,
    reason: row.reason,
    requestedScopes: row.requested_scopes || [],
    approvedScopes: row.approved_scopes || [],
    status: row.status,
    codeHash: row.code_hash,
    expiresAt: row.expires_at,
    approvedBy: row.approved_by,
    rejectedBy: row.rejected_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function tokenFromRow(row: any): AgentToken {
  return {
    id: row.id,
    requestId: row.request_id,
    agentName: row.agent_name,
    toolName: row.tool_name,
    tokenHash: row.token_hash,
    scopes: row.scopes || [],
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at
  }
}

export function createSupabaseAgentAccessRequestRepository(
  supabase: SupabaseDataClient
): AgentAccessRequestRepository {
  return {
    async create(input) {
      const { data, error } = await supabase
        .from('agent_access_requests')
        .insert({
          agent_name: input.agentName,
          tool_name: input.toolName,
          reason: input.reason,
          requested_scopes: input.requestedScopes,
          approved_scopes: [],
          status: 'pending',
          code_hash: input.codeHash,
          expires_at: input.expiresAt
        })
        .select()
        .single()

      if (error || !data) databaseError('Failed to create agent access request', error)
      return requestFromRow(data)
    },

    async findByCodeHash(codeHash) {
      const { data, error } = await supabase
        .from('agent_access_requests')
        .select()
        .eq('code_hash', codeHash)
        .maybeSingle()

      if (error) databaseError('Failed to find agent access request', error)
      return data ? requestFromRow(data) : null
    },

    async listActive() {
      const { data, error } = await supabase
        .from('agent_access_requests')
        .select()
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })

      if (error) databaseError('Failed to list agent access requests', error)
      return (data || []).map(requestFromRow)
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('agent_access_requests')
        .select()
        .eq('id', id)
        .maybeSingle()

      if (error) databaseError('Failed to find agent access request', error)
      return data ? requestFromRow(data) : null
    },

    async approve(id, input) {
      const { data, error } = await supabase
        .from('agent_access_requests')
        .update({
          approved_scopes: input.approvedScopes,
          approved_by: input.approvedBy,
          status: 'approved'
        })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) databaseError('Failed to approve agent access request', error)
      return requestFromRow(data)
    },

    async reject(id, rejectedBy) {
      const { data, error } = await supabase
        .from('agent_access_requests')
        .update({
          rejected_by: rejectedBy,
          status: 'rejected'
        })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) databaseError('Failed to reject agent access request', error)
      return requestFromRow(data)
    },

    async markExpired(id) {
      const { data, error } = await supabase
        .from('agent_access_requests')
        .update({ status: 'expired' })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) databaseError('Failed to expire agent access request', error)
      return requestFromRow(data)
    }
  }
}

export function createSupabaseAgentTokenRepository(
  supabase: SupabaseDataClient
): AgentTokenRepository {
  return {
    async create(input) {
      const { data, error } = await supabase
        .from('agent_tokens')
        .insert({
          request_id: input.requestId,
          agent_name: input.agentName,
          tool_name: input.toolName,
          token_hash: input.tokenHash,
          scopes: input.scopes,
          expires_at: input.expiresAt
        })
        .select()
        .single()

      if (error || !data) databaseError('Failed to create agent token', error)
      return tokenFromRow(data)
    },

    async findByTokenHash(tokenHash) {
      const { data, error } = await supabase
        .from('agent_tokens')
        .select()
        .eq('token_hash', tokenHash)
        .maybeSingle()

      if (error) databaseError('Failed to find agent token', error)
      return data ? tokenFromRow(data) : null
    },

    async listActive(nowIso) {
      const { data, error } = await supabase
        .from('agent_tokens')
        .select()
        .is('revoked_at', null)
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false })

      if (error) databaseError('Failed to list agent tokens', error)
      return (data || []).map(tokenFromRow)
    },

    async revoke(id, revokedAt) {
      const { data, error } = await supabase
        .from('agent_tokens')
        .update({ revoked_at: revokedAt })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) databaseError('Failed to revoke agent token', error)
      return tokenFromRow(data)
    },

    async touchLastUsed(id, lastUsedAt) {
      const { error } = await supabase
        .from('agent_tokens')
        .update({ last_used_at: lastUsedAt })
        .eq('id', id)

      if (error) databaseError('Failed to update agent token usage', error)
    }
  }
}

export function createSupabaseAgentAuditRepository(
  supabase: SupabaseDataClient
): AgentAuditRepository {
  return {
    async record(event) {
      const { error } = await supabase
        .from('agent_audit_events')
        .insert({
          actor_type: event.actorType,
          action: event.action,
          result: event.result,
          agent_token_id: event.agentTokenId || null,
          access_request_id: event.accessRequestId || null,
          admin_user_id: event.adminUserId || null,
          scope: event.scope || null,
          route: event.route || null,
          metadata: event.metadata || {}
        })

      if (error) databaseError('Failed to record agent audit event', error)
    }
  }
}
