import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminBlogPostGateway } from '@/lib/client/application/admin/blog-posts'
import type { AdminBlogTaxonomyGateway } from '@/lib/client/application/admin/blog-taxonomy'
import type {
  AdminBlogCategory,
  AdminBlogCategoryFormData,
  AdminBlogPostList,
  AdminBlogTagFormData
} from '@/lib/client/domain/admin-blog'
import type { BlogCategory, BlogTag } from '@/lib/types/blog'

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

export function createAdminBlogTaxonomyApiGateway(
  client: JsonClient = createFetchJsonClient()
): AdminBlogTaxonomyGateway {
  return {
    async listCategories() {
      const response = await client.get<DataResponse<AdminBlogCategory[]>>('/api/admin/blog/categories')
      return response.data || []
    },
    async createCategory(input: AdminBlogCategoryFormData) {
      const response = await client.post<DataResponse<AdminBlogCategory>>('/api/admin/blog/categories', {
        ...input,
        description: input.description || null
      })
      return response.data
    },
    async updateCategory(id: string, input: AdminBlogCategoryFormData) {
      const response = await client.put<DataResponse<AdminBlogCategory>>(`/api/admin/blog/categories/${id}`, {
        ...input,
        description: input.description || null
      })
      return response.data
    },
    async deleteCategory(id: string) {
      await client.delete(`/api/admin/blog/categories/${id}`)
    },
    async listTags() {
      const response = await client.get<DataResponse<BlogTag[]>>('/api/admin/blog/tags')
      return response.data || []
    },
    async createTag(input: AdminBlogTagFormData) {
      const response = await client.post<DataResponse<BlogTag>>('/api/admin/blog/tags', {
        ...input,
        description: input.description || null
      })
      return response.data
    },
    async updateTag(id: string, input: AdminBlogTagFormData) {
      const response = await client.put<DataResponse<BlogTag>>(`/api/admin/blog/tags/${id}`, {
        ...input,
        description: input.description || null
      })
      return response.data
    },
    async deleteTag(id: string) {
      await client.delete(`/api/admin/blog/tags/${id}`)
    }
  }
}
