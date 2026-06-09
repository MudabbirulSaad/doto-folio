import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminAgentGateway } from '@/lib/client/application/admin/agents'
import type {
  AdminAgentAccessRequest,
  AdminAgentInvitation,
  AdminAgentToken,
  ClientAgentScope
} from '@/lib/client/domain/admin-agents'

interface DataResponse<T> {
  data: T
}

export function createAdminAgentApiGateway(client: JsonClient = createFetchJsonClient()): AdminAgentGateway {
  return {
    async listRequests() {
      const response = await client.get<DataResponse<AdminAgentAccessRequest[]>>('/api/admin/agents/access-requests')
      return response.data
    },

    async listInvitations() {
      const response = await client.get<DataResponse<AdminAgentInvitation[]>>('/api/admin/agents/invitations')
      return response.data
    },

    async createInvitation(input) {
      const response = await client.post<DataResponse<{
        invitation: AdminAgentInvitation
        code: string
        expiresAt: string
      }>>('/api/admin/agents/invitations', input)
      return response.data
    },

    async revokeInvitation(id: string) {
      const response = await client.post<DataResponse<AdminAgentInvitation>>(
        `/api/admin/agents/invitations/${id}/revoke`,
        {}
      )
      return response.data
    },

    async approveRequest(id: string, approvedScopes: ClientAgentScope[]) {
      const response = await client.post<DataResponse<AdminAgentAccessRequest>>(
        `/api/admin/agents/access-requests/${id}/approve`,
        { approvedScopes }
      )
      return response.data
    },

    async rejectRequest(id: string) {
      const response = await client.post<DataResponse<AdminAgentAccessRequest>>(
        `/api/admin/agents/access-requests/${id}/reject`,
        {}
      )
      return response.data
    },

    async listTokens() {
      const response = await client.get<DataResponse<AdminAgentToken[]>>('/api/admin/agents/tokens')
      return response.data
    },

    async updateTokenAccess(id: string, input) {
      const response = await client.put<DataResponse<AdminAgentToken>>(
        `/api/admin/agents/tokens/${id}`,
        input
      )
      return response.data
    },

    async revokeToken(id: string) {
      const response = await client.post<DataResponse<AdminAgentToken>>(`/api/admin/agents/tokens/${id}/revoke`, {})
      return response.data
    }
  }
}
