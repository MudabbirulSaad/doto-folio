import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { ContactSubmissionGateway } from '@/lib/client/application/contact/contact-form'
import type { ContactFormData, ContactSubmissionResult } from '@/lib/client/domain/contact'

interface ContactApiResponse {
  message?: string
  data?: Record<string, unknown>
  error?: string
}

export function createContactApiGateway(client: JsonClient = createFetchJsonClient()): ContactSubmissionGateway {
  return {
    async submit(formData: ContactFormData): Promise<ContactSubmissionResult> {
      const response = await client.post<ContactApiResponse>('/api/contact', formData)

      return {
        success: true,
        message: response.message,
        data: response.data
      }
    }
  }
}
