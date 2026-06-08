import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { CommentGateway } from '@/lib/client/application/comments/comments'
import type { ClientComment, CreateCommentInput } from '@/lib/client/domain/comments'

interface DataResponse<T> {
  data: T
}

export function createCommentApiGateway(client: JsonClient = createFetchJsonClient()): CommentGateway {
  return {
    async list(postId: string) {
      const response = await client.get<DataResponse<ClientComment[]>>(`/api/comments?postId=${postId}`)
      return response.data || []
    },
    async create(accessToken: string, input: CreateCommentInput) {
      const response = await client.post<DataResponse<ClientComment>>('/api/comments', input, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      return response.data
    }
  }
}
