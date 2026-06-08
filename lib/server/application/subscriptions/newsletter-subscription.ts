import { ApplicationError } from '@/lib/server/domain/errors'

export interface SubscriptionEmailResult {
  success: boolean
  error?: string
  welcomeEmailSent?: boolean
  adminNotificationSent?: boolean
}

export interface SubscriberRepository {
  findByEmail(email: string): Promise<{ id: string; status: string } | null>
  createSubscriber(data: { email: string; name: string | null; status: 'active' }): Promise<Record<string, unknown>>
  reactivateSubscriber(id: string, data: { status: 'active'; name: string | null; subscribed_at: string; unsubscribed_at: null; updated_at: string }): Promise<void>
}

export interface SubscriptionEmailNotifier {
  sendWelcomeEmail(name: string, email: string): Promise<SubscriptionEmailResult>
}

export async function subscribeToNewsletter(
  repository: SubscriberRepository,
  notifier: SubscriptionEmailNotifier | null,
  input: { name?: string; email: string },
  options: { now?: () => Date } = {}
) {
  const email = input.email.trim().toLowerCase()
  const name = input.name?.trim() || null

  if (!email) {
    throw new ApplicationError('VALIDATION_ERROR', 'Email is required')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApplicationError('VALIDATION_ERROR', 'Please enter a valid email address')
  }

  const existingSubscriber = await repository.findByEmail(email)

  if (existingSubscriber?.status === 'active') {
    throw new ApplicationError('FORBIDDEN', 'This email is already subscribed to our newsletter')
  }

  if (existingSubscriber) {
    const now = (options.now || (() => new Date()))().toISOString()
    await repository.reactivateSubscriber(existingSubscriber.id, {
      status: 'active',
      name,
      subscribed_at: now,
      unsubscribed_at: null,
      updated_at: now
    })
    await notifier?.sendWelcomeEmail(name || '', email).catch(() => undefined)
    return { status: 'reactivated' as const }
  }

  const subscriber = await repository.createSubscriber({ email, name, status: 'active' })
  await notifier?.sendWelcomeEmail(name || '', email).catch(() => undefined)
  return { status: 'created' as const, subscriber }
}
