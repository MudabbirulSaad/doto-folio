import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminProjectGateway } from '@/lib/client/application/admin/projects'
import type { AdminProject, AdminProjectFormData } from '@/lib/client/domain/admin-content'

interface DataResponse<T> {
  data: T
}

export function createAdminProjectApiGateway(client: JsonClient = createFetchJsonClient()): AdminProjectGateway {
  return {
    async list() {
      const response = await client.get<DataResponse<AdminProject[]>>('/api/admin/content/projects')
      return response.data
    },
    async create(input: AdminProjectFormData) {
      const response = await client.post<DataResponse<AdminProject>>('/api/admin/content/projects', input)
      return response.data
    },
    async update(id: string, input: AdminProjectFormData) {
      const response = await client.put<DataResponse<AdminProject>>(`/api/admin/content/projects/${id}`, input)
      return response.data
    },
    async delete(id: string) {
      await client.delete(`/api/admin/content/projects/${id}`)
    }
  }
}
