import { sendSubscriptionWelcomeEmail, type EmailConfig } from '@/lib/services/email'
import type { SubscriptionEmailNotifier } from '@/lib/server/application/subscriptions/newsletter-subscription'

export function createSubscriptionEmailNotifier(config: EmailConfig): SubscriptionEmailNotifier {
  return {
    sendWelcomeEmail(name, email) {
      return sendSubscriptionWelcomeEmail(name, email, config)
    }
  }
}
