import { requireEmail } from '@/lib/client/application/forms'
import type {
  NewsletterSubscriptionFormData,
  NewsletterSubscriptionResult
} from '@/lib/client/domain/subscription'

export interface NewsletterSubscriptionGateway {
  subscribe(formData: NewsletterSubscriptionFormData): Promise<NewsletterSubscriptionResult>
}

export async function subscribeToNewsletterForm(
  gateway: NewsletterSubscriptionGateway,
  formData: NewsletterSubscriptionFormData
): Promise<NewsletterSubscriptionResult> {
  const email = requireEmail(formData.email)

  if (!email.ok) {
    return { success: false, error: email.error }
  }

  try {
    return await gateway.subscribe({
      name: formData.name.trim(),
      email: email.value
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to subscribe. Please try again.'
    }
  }
}
