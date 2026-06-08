import { createFetchJsonClient, type JsonClient } from '@/lib/client/adapters/http/json-client'
import type { NewsletterSubscriptionGateway } from '@/lib/client/application/subscriptions/newsletter-form'
import type {
  NewsletterSubscriptionFormData,
  NewsletterSubscriptionResult
} from '@/lib/client/domain/subscription'

interface SubscriptionApiResponse {
  message?: string
  error?: string
}

export function createNewsletterSubscriptionApiGateway(
  client: JsonClient = createFetchJsonClient()
): NewsletterSubscriptionGateway {
  return {
    async subscribe(formData: NewsletterSubscriptionFormData): Promise<NewsletterSubscriptionResult> {
      const response = await client.post<SubscriptionApiResponse>('/api/subscribe', formData)

      return {
        success: true,
        message: response.message
      }
    }
  }
}
