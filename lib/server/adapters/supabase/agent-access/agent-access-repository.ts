import { ApplicationError } from '@/lib/server/domain/errors'
import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type {
  AgentAccessRequest,
  AgentAccessRequestStatus,
  AgentAccessRequestRepository,
  AgentAuditRepository,
  AgentInvitation,
  AgentInvitationStatus,
  AgentInvitationRepository,
  AgentScope,
  AgentToken,
  AgentTokenRepository
} from '@/lib/server/application/agent-access/agent-access'

function databaseError(message: string, error: { message: string } | null): never {
  throw new ApplicationError('DATABASE_ERROR', message, error ? [error.message] : undefined)
}

interface AgentAccessRequestRow {
  id: string
  agent_name: string
  tool_name: string
  reason: string
  requested_scopes?: AgentScope[] | null
  approved_scopes?: AgentScope[] | null
  status: AgentAccessRequestStatus
  code_hash: string
  expires_at: string
  approved_by?: string | null
  rejected_by?: string | null
  created_at: string
  updated_at: string
}

interface AgentTokenRow {
  id: string
  request_id?: string | null
  invitation_id?: string | null
  agent_name: string
  tool_name: string
  token_hash: string
  scopes?: AgentScope[] | null
  expires_at: string | null
  revoked_at?: string | null
  last_used_at?: string | null
  created_at: string
}

interface AgentInvitationRow {
  id: string
  agent_label: string
  tool_name: string
  scopes?: AgentScope[] | null
  instructions_md?: string | null
  status: AgentInvitationStatus
  code_hash: string
  expires_at: string
  token_expires_at: string | null
  created_by: string
  claimed_token_id?: string | null
  claimed_at?: string | null
  created_at: string
  updated_at: string
}

function requestFromRow(row: AgentAccessRequestRow): AgentAccessRequest {
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

function tokenFromRow(row: AgentTokenRow): AgentToken {
  return {
    id: row.id,
    requestId: row.request_id,
    invitationId: row.invitation_id,
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

function invitationFromRow(row: AgentInvitationRow): AgentInvitation {
  return {
    id: row.id,
    agentLabel: row.agent_label,
    toolName: row.tool_name,
    scopes: row.scopes || [],
    instructionsMd: row.instructions_md || '',
    status: row.status,
    codeHash: row.code_hash,
    expiresAt: row.expires_at,
    tokenExpiresAt: row.token_expires_at,
    createdBy: row.created_by,
    claimedTokenId: row.claimed_token_id,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
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

export function createSupabaseAgentInvitationRepository(
  supabase: SupabaseDataClient
): AgentInvitationRepository {
  return {
    async create(input) {
      const { data, error } = await supabase
        .from('agent_invitations')
        .insert({
          agent_label: input.agentLabel,
          tool_name: input.toolName,
          scopes: input.scopes,
          instructions_md: input.instructionsMd,
          status: 'pending',
          code_hash: input.codeHash,
          expires_at: input.expiresAt,
          token_expires_at: input.tokenExpiresAt,
          created_by: input.createdBy
        })
        .select()
        .single()

      if (error || !data) databaseError('Failed to create agent invitation', error)
      return invitationFromRow(data)
    },

    async findByCodeHash(codeHash) {
      const { data, error } = await supabase
        .from('agent_invitations')
        .select()
        .eq('code_hash', codeHash)
        .maybeSingle()

      if (error) databaseError('Failed to find agent invitation', error)
      return data ? invitationFromRow(data) : null
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('agent_invitations')
        .select()
        .eq('id', id)
        .maybeSingle()

      if (error) databaseError('Failed to find agent invitation', error)
      return data ? invitationFromRow(data) : null
    },

    async findByTokenId(tokenId) {
      const { data, error } = await supabase
        .from('agent_invitations')
        .select()
        .eq('claimed_token_id', tokenId)
        .maybeSingle()

      if (error) databaseError('Failed to find agent invitation by token', error)
      return data ? invitationFromRow(data) : null
    },

    async listActive() {
      const { data, error } = await supabase
        .from('agent_invitations')
        .select()
        .in('status', ['pending', 'claimed'])
        .order('created_at', { ascending: false })

      if (error) databaseError('Failed to list agent invitations', error)
      return (data || []).map(invitationFromRow)
    },

    async markClaimed(id, input) {
      const { data, error } = await supabase
        .from('agent_invitations')
        .update({
          status: 'claimed',
          claimed_token_id: input.claimedTokenId,
          claimed_at: input.claimedAt
        })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) databaseError('Failed to claim agent invitation', error)
      return invitationFromRow(data)
    },

    async markExpired(id) {
      const { data, error } = await supabase
        .from('agent_invitations')
        .update({ status: 'expired' })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) databaseError('Failed to expire agent invitation', error)
      return invitationFromRow(data)
    },

    async revoke(id) {
      const { data, error } = await supabase
        .from('agent_invitations')
        .update({ status: 'revoked' })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) databaseError('Failed to revoke agent invitation', error)
      return invitationFromRow(data)
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
          invitation_id: input.invitationId,
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

    async findById(id) {
      const { data, error } = await supabase
        .from('agent_tokens')
        .select()
        .eq('id', id)
        .maybeSingle()

      if (error) databaseError('Failed to find agent token', error)
      return data ? tokenFromRow(data) : null
    },

    async listActive(nowIso) {
      const { data, error } = await supabase
        .from('agent_tokens')
        .select()
        .is('revoked_at', null)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order('created_at', { ascending: false })

      if (error) databaseError('Failed to list agent tokens', error)
      return (data || []).map(tokenFromRow)
    },

    async updateAccess(id, input) {
      const { data, error } = await supabase
        .from('agent_tokens')
        .update({
          scopes: input.scopes,
          expires_at: input.expiresAt
        })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) databaseError('Failed to update agent token access', error)
      return tokenFromRow(data)
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
          invitation_id: event.invitationId || null,
          admin_user_id: event.adminUserId || null,
          scope: event.scope || null,
          route: event.route || null,
          metadata: event.metadata || {}
        })

      if (error) databaseError('Failed to record agent audit event', error)
    }
  }
}
