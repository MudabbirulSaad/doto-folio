import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminSiteContentGateway } from '@/lib/client/application/admin/site-content'
import type { AdminSiteContent } from '@/lib/client/domain/admin-content'

interface DataResponse<T> {
  data: T
}

export function createAdminSiteContentApiGateway(
  client: JsonClient = createFetchJsonClient()
): AdminSiteContentGateway {
  return {
    async get() {
      const response = await client.get<DataResponse<AdminSiteContent>>('/api/admin/content/site')
      return response.data
    },
    async save(content) {
      const response = await client.put<DataResponse<AdminSiteContent>>('/api/admin/content/site', content)
      return response.data
    }
  }
}
