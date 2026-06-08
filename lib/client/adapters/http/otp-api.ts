import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { OtpGateway } from '@/lib/client/application/auth/otp'

interface DataResponse<T> {
  data: T
}

export function createOtpApiGateway(client: JsonClient = createFetchJsonClient()): OtpGateway {
  return {
    async request(input) {
      await client.post('/api/auth/otp', input)
    },
    async verify(input) {
      const response = await client.put<DataResponse<{ session?: unknown }>>('/api/auth/otp', input)
      return response.data
    }
  }
}
