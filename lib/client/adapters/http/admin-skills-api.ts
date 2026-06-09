import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminSkillGateway } from '@/lib/client/application/admin/skills'
import type { AdminSkill, AdminSkillFormData } from '@/lib/client/domain/admin-content'

interface DataResponse<T> {
  data: T
}

export function createAdminSkillApiGateway(client: JsonClient = createFetchJsonClient()): AdminSkillGateway {
  return {
    async list() {
      const response = await client.get<DataResponse<AdminSkill[]>>('/api/admin/content/skills')
      return response.data || []
    },
    async create(input: AdminSkillFormData) {
      const response = await client.post<DataResponse<AdminSkill>>('/api/admin/content/skills', input)
      return response.data
    },
    async update(id: string, input: AdminSkillFormData) {
      const response = await client.put<DataResponse<AdminSkill>>(`/api/admin/content/skills/${id}`, input)
      return response.data
    },
    async delete(id: string) {
      await client.delete(`/api/admin/content/skills/${id}`)
    }
  }
}
