import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { AdminRecaptchaGateway } from '@/lib/client/application/admin/recaptcha'

interface RecaptchaResponse {
  success: boolean
}

export function createAdminRecaptchaApiGateway(client: JsonClient = createFetchJsonClient()): AdminRecaptchaGateway {
  return {
    async verify(token: string) {
      const response = await client.post<RecaptchaResponse>('/api/admin/auth/verify-recaptcha', { token })
      return response.success
    }
  }
}
