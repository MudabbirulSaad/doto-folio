import { createClient } from '@supabase/supabase-js'
import type { SupabaseAdminDataClient } from '@/lib/server/adapters/supabase/types'
import { subscribeToNewsletter } from '@/lib/server/application/subscriptions/newsletter-subscription'
import { createSupabaseSubscriberRepository } from '@/lib/server/adapters/supabase/subscriptions/subscriber-repository'
import { createSubscriptionEmailNotifier } from '@/lib/server/adapters/email/subscription-email-notifier'

function createSupabaseAdminClient(): SupabaseAdminDataClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as unknown as SupabaseAdminDataClient
}

function createOptionalSubscriptionEmailNotifier() {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_PASS
  const adminEmail = process.env.ADMIN_EMAIL

  if (!gmailUser || !gmailPass) return null
  return createSubscriptionEmailNotifier({ gmailUser, gmailPass, adminEmail: adminEmail || gmailUser })
}

export function createNewsletterSubscriptionUseCase() {
  const repository = createSupabaseSubscriberRepository(createSupabaseAdminClient())
  const notifier = createOptionalSubscriptionEmailNotifier()
  return (input: { name?: string; email: string }) => subscribeToNewsletter(repository, notifier, input)
}
