import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminSkillCapabilityGateway } from '@/lib/client/application/admin/skill-capabilities'
import type {
  AdminSkillCapability,
  AdminSkillCapabilityFormData,
  AdminSkillEvidence,
  AdminSkillEvidenceFormData
} from '@/lib/client/domain/admin-content'

interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export function createAdminSkillCapabilityApiGateway(
  client: JsonClient = createFetchJsonClient()
): AdminSkillCapabilityGateway {
  return {
    async list() {
      const response = await client.get<ApiSuccessResponse<AdminSkillCapability[]>>('/api/admin/content/skill-capabilities')
      return response.data || []
    },
    async createCapability(input: AdminSkillCapabilityFormData) {
      const response = await client.post<ApiSuccessResponse<AdminSkillCapability>>('/api/admin/content/skill-capabilities', input)
      return response.data
    },
    async updateCapability(id: string, input: AdminSkillCapabilityFormData) {
      const response = await client.put<ApiSuccessResponse<AdminSkillCapability>>(`/api/admin/content/skill-capabilities/${id}`, input)
      return response.data
    },
    async deleteCapability(id: string) {
      await client.delete(`/api/admin/content/skill-capabilities/${id}`)
    },
    async createEvidence(capabilityId: string, input: AdminSkillEvidenceFormData) {
      const response = await client.post<ApiSuccessResponse<AdminSkillEvidence>>(`/api/admin/content/skill-capabilities/${capabilityId}/evidence`, input)
      return response.data
    },
    async updateEvidence(id: string, input: AdminSkillEvidenceFormData) {
      const response = await client.put<ApiSuccessResponse<AdminSkillEvidence>>(`/api/admin/content/skill-evidence/${id}`, input)
      return response.data
    },
    async deleteEvidence(id: string) {
      await client.delete(`/api/admin/content/skill-evidence/${id}`)
    }
  }
}
