import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminContentOverviewGateway } from '@/lib/client/application/admin/content-overview'
import type { AdminContentOverviewStats } from '@/lib/client/domain/admin-overview'

interface OverviewResponse {
  data: AdminContentOverviewStats
}

export function createAdminContentOverviewApiGateway(
  client: JsonClient = createFetchJsonClient()
): AdminContentOverviewGateway {
  return {
    async getOverview() {
      const response = await client.get<OverviewResponse>('/api/admin/content/overview')
      return response.data
    }
  }
}
