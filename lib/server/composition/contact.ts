import { createAdminClient } from '@/lib/supabase/admin'
import { submitContactMessage } from '@/lib/server/application/contact/contact-submission'
import { createSupabaseContactSubmissionRepository } from '@/lib/server/adapters/supabase/contact/contact-submission-repository'
import { createContactEmailNotifier } from '@/lib/server/adapters/email/contact-email-notifier'
import type { ContactFormData } from '@/lib/services/contact'

function createOptionalContactEmailNotifier() {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_PASS
  const adminEmail = process.env.ADMIN_EMAIL

  if (!gmailUser || !gmailPass || !adminEmail) {
    return null
  }

  return createContactEmailNotifier({ gmailUser, gmailPass, adminEmail })
}

export function createContactSubmissionUseCase() {
  const repository = createSupabaseContactSubmissionRepository(createAdminClient())
  const notifier = createOptionalContactEmailNotifier()

  return (formData: ContactFormData) => submitContactMessage(repository, notifier, formData)
}
