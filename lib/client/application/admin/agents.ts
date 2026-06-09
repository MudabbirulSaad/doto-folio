import type {
  AdminAgentAccessRequest,
  AdminAgentInvitation,
  AdminAgentToken,
  ClientAgentScope
} from '@/lib/client/domain/admin-agents'

export interface AdminAgentGateway {
  listRequests(): Promise<AdminAgentAccessRequest[]>
  listInvitations(): Promise<AdminAgentInvitation[]>
  createInvitation(input: {
    agentLabel: string
    toolName: string
    scopes: ClientAgentScope[]
    instructionsMd?: string
    inviteExpiresAt?: string
    tokenExpiresAt?: string | null
  }): Promise<{ invitation: AdminAgentInvitation; code: string; expiresAt: string }>
  revokeInvitation(id: string): Promise<AdminAgentInvitation>
  approveRequest(id: string, approvedScopes: ClientAgentScope[]): Promise<AdminAgentAccessRequest>
  rejectRequest(id: string): Promise<AdminAgentAccessRequest>
  listTokens(): Promise<AdminAgentToken[]>
  updateTokenAccess(id: string, input: {
    scopes: ClientAgentScope[]
    expiresAt: string | null
  }): Promise<AdminAgentToken>
  revokeToken(id: string): Promise<AdminAgentToken>
}

export async function loadAdminAgents(gateway: AdminAgentGateway) {
  const [requests, invitations, tokens] = await Promise.all([
    gateway.listRequests(),
    gateway.listInvitations(),
    gateway.listTokens()
  ])

  return { requests, invitations, tokens }
}

function workflowError(error: unknown, fallback: string) {
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback
  }
}

export async function approveAdminAgentRequest(
  gateway: AdminAgentGateway,
  id: string,
  approvedScopes: ClientAgentScope[]
) {
  try {
    return { success: true as const, value: await gateway.approveRequest(id, approvedScopes) }
  } catch (error) {
    return workflowError(error, 'Failed to approve agent request')
  }
}

export async function rejectAdminAgentRequest(gateway: AdminAgentGateway, id: string) {
  try {
    return { success: true as const, value: await gateway.rejectRequest(id) }
  } catch (error) {
    return workflowError(error, 'Failed to reject agent request')
  }
}

export async function createAdminAgentInvitation(
  gateway: AdminAgentGateway,
  input: Parameters<AdminAgentGateway['createInvitation']>[0]
) {
  try {
    return { success: true as const, value: await gateway.createInvitation(input) }
  } catch (error) {
    return workflowError(error, 'Failed to create agent invitation')
  }
}

export async function revokeAdminAgentInvitation(gateway: AdminAgentGateway, id: string) {
  try {
    return { success: true as const, value: await gateway.revokeInvitation(id) }
  } catch (error) {
    return workflowError(error, 'Failed to revoke agent invitation')
  }
}

export async function revokeAdminAgentToken(gateway: AdminAgentGateway, id: string) {
  try {
    return { success: true as const, value: await gateway.revokeToken(id) }
  } catch (error) {
    return workflowError(error, 'Failed to revoke agent token')
  }
}

export async function updateAdminAgentTokenAccess(
  gateway: AdminAgentGateway,
  id: string,
  input: Parameters<AdminAgentGateway['updateTokenAccess']>[1]
) {
  try {
    return { success: true as const, value: await gateway.updateTokenAccess(id, input) }
  } catch (error) {
    return workflowError(error, 'Failed to update agent token access')
  }
}
