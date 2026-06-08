import { describe, expect, it, vi } from 'vitest'
import {
  submitContactForm,
  validateContactForm,
  type ContactSubmissionGateway
} from '@/lib/client/application/contact/contact-form'
import {
  subscribeToNewsletterForm,
  type NewsletterSubscriptionGateway
} from '@/lib/client/application/subscriptions/newsletter-form'

describe('contact form workflow', () => {
  it('validates fields before submission', () => {
    expect(validateContactForm({ name: '', email: 'bad', subject: 'Hi', message: 'short' })).toEqual({
      isValid: false,
      errors: {
        name: 'Name is required',
        email: 'Please enter a valid email address',
        subject: 'Subject must be at least 5 characters long',
        message: 'Message must be at least 10 characters long'
      }
    })
  })

  it('normalizes data before sending through the gateway', async () => {
    const gateway: ContactSubmissionGateway = {
      submit: vi.fn(async () => ({ success: true, message: 'Sent' }))
    }

    const result = await submitContactForm(gateway, {
      name: ' Ada ',
      email: 'ADA@EXAMPLE.COM ',
      subject: ' Project ',
      message: ' Hello there '
    })

    expect(result).toEqual({ success: true, message: 'Sent' })
    expect(gateway.submit).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Project',
      message: 'Hello there'
    })
  })
})

describe('newsletter subscription workflow', () => {
  it('rejects invalid email before calling the gateway', async () => {
    const gateway: NewsletterSubscriptionGateway = {
      subscribe: vi.fn()
    }

    const result = await subscribeToNewsletterForm(gateway, { name: 'Ada', email: 'bad' })

    expect(result).toEqual({ success: false, error: 'Please enter a valid email address' })
    expect(gateway.subscribe).not.toHaveBeenCalled()
  })

  it('submits normalized subscriber data through the gateway', async () => {
    const gateway: NewsletterSubscriptionGateway = {
      subscribe: vi.fn(async () => ({ success: true, message: 'Subscribed' }))
    }

    await subscribeToNewsletterForm(gateway, { name: ' Ada ', email: 'ADA@EXAMPLE.COM ' })

    expect(gateway.subscribe).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com' })
  })
})
