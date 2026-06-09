import type {
  AdminAgentAccessRequest,
  AdminAgentToken,
  ClientAgentScope
} from '@/lib/client/domain/admin-agents'

export interface AdminAgentGateway {
  listRequests(): Promise<AdminAgentAccessRequest[]>
  approveRequest(id: string, approvedScopes: ClientAgentScope[]): Promise<AdminAgentAccessRequest>
  rejectRequest(id: string): Promise<AdminAgentAccessRequest>
  listTokens(): Promise<AdminAgentToken[]>
  revokeToken(id: string): Promise<AdminAgentToken>
}

export async function loadAdminAgents(gateway: AdminAgentGateway) {
  const [requests, tokens] = await Promise.all([
    gateway.listRequests(),
    gateway.listTokens()
  ])

  return { requests, tokens }
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

export async function revokeAdminAgentToken(gateway: AdminAgentGateway, id: string) {
  try {
    return { success: true as const, value: await gateway.revokeToken(id) }
  } catch (error) {
    return workflowError(error, 'Failed to revoke agent token')
  }
}
