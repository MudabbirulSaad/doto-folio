import { sendContactEmails, type EmailConfig } from '@/lib/services/email'
import type { ContactEmailNotifier } from '@/lib/server/application/contact/contact-submission'

export function createContactEmailNotifier(config: EmailConfig): ContactEmailNotifier {
  return {
    sendContactNotifications(formData) {
      return sendContactEmails(formData, config)
    }
  }
}
