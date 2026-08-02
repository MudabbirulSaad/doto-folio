import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type {
  AdminContactContent,
  AdminSocialLink,
  AdminSocialLinkFormData
} from '@/lib/client/domain/admin-content'

interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

interface CreatedContactContent<T> {
  data: T
  message: string
}

export interface AdminContactContentGateway {
  list(): Promise<AdminContactContent>
  createSocialLink(input: AdminSocialLinkFormData): Promise<AdminSocialLink>
}

export function createAdminContactContentApiGateway(
  client: JsonClient = createFetchJsonClient()
): AdminContactContentGateway {
  return {
    async list() {
      const response = await client.get<ApiSuccessResponse<AdminContactContent>>(
        '/api/admin/content/contact'
      )
      return response.data
    },
    async createSocialLink(input) {
      const response = await client.post<ApiSuccessResponse<CreatedContactContent<AdminSocialLink>>>(
        '/api/admin/content/contact',
        {
          type: 'social_link',
          ...input,
          username: input.username.trim() || null,
          is_published: true
        }
      )
      return response.data.data
    }
  }
}
