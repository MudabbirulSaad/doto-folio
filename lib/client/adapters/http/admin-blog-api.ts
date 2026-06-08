import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminBlogPostGateway } from '@/lib/client/application/admin/blog-posts'
import type { AdminBlogPostList } from '@/lib/client/domain/admin-blog'
import type { BlogCategory } from '@/lib/types/blog'

interface DataResponse<T> {
  data: T
}

export function createAdminBlogPostApiGateway(client: JsonClient = createFetchJsonClient()): AdminBlogPostGateway {
  return {
    async listPosts() {
      const response = await client.get<DataResponse<AdminBlogPostList>>('/api/admin/blog/posts')
      return response.data
    },
    async listCategories() {
      const response = await client.get<DataResponse<BlogCategory[]>>('/api/admin/blog/categories')
      return response.data
    },
    async deletePost(id: string) {
      await client.delete(`/api/admin/blog/posts/${id}`)
    }
  }
}
