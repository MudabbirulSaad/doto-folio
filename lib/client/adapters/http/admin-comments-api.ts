import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminCommentGateway } from '@/lib/client/application/admin/comments'
import type { AdminComment } from '@/lib/client/domain/admin-comments'
import type { CreateCommentInput } from '@/lib/client/domain/comments'

interface DataResponse<T> {
  data: T
}

export function createAdminCommentApiGateway(client: JsonClient = createFetchJsonClient()): AdminCommentGateway {
  return {
    async list() {
      const response = await client.get<DataResponse<AdminComment[]>>('/api/admin/comments')
      return response.data || []
    },
    async delete(id: string) {
      await client.delete(`/api/admin/comments?id=${id}`)
    },
    async reply(accessToken: string, input: CreateCommentInput) {
      const response = await client.post<DataResponse<unknown>>('/api/comments', input, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      return response.data
    }
  }
}
