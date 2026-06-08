import test from 'node:test'
import assert from 'node:assert/strict'
import { ApplicationError } from '../lib/server/domain/errors'
import { requestMagicLink, requestOtp, verifyOtp } from '../lib/server/application/auth/auth-flows'
import { subscribeToNewsletter, type SubscriberRepository } from '../lib/server/application/subscriptions/newsletter-subscription'

function subscribers(existing: { id: string; status: string } | null = null): SubscriberRepository & { created: unknown[]; reactivated: string[] } {
  return {
    created: [],
    reactivated: [],
    async findByEmail() {
      return existing
    },
    async createSubscriber(data) {
      this.created.push(data)
      return { id: 'sub-1', ...data }
    },
    async reactivateSubscriber(id) {
      this.reactivated.push(id)
    }
  }
}

test('subscribeToNewsletter creates, rejects duplicate active, and reactivates inactive subscribers', async () => {
  const createdRepo = subscribers()
  const created = await subscribeToNewsletter(createdRepo, null, { name: 'Ada', email: 'ADA@EXAMPLE.COM' })
  assert.equal(created.status, 'created')
  assert.deepEqual(createdRepo.created[0], { email: 'ada@example.com', name: 'Ada', status: 'active' })

  await assert.rejects(
    () => subscribeToNewsletter(subscribers({ id: 'sub-1', status: 'active' }), null, { email: 'ada@example.com' }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'FORBIDDEN'
  )

  const inactiveRepo = subscribers({ id: 'sub-2', status: 'unsubscribed' })
  const reactivated = await subscribeToNewsletter(inactiveRepo, null, { name: '', email: 'ada@example.com' })
  assert.equal(reactivated.status, 'reactivated')
  assert.deepEqual(inactiveRepo.reactivated, ['sub-2'])
})

test('auth flows verify humans before delegating to auth delivery ports', async () => {
  const calls: string[] = []
  const verifier = { async verify() { calls.push('verify'); return true } }
  const auth = {
    async sendOtp(email: string) { calls.push(`otp:${email}`) },
    async sendMagicLink(email: string) { calls.push(`magic:${email}`) },
    async verifyOtp() { calls.push('verifyOtp'); return { session: { id: 'session' }, user: { id: 'user' } } }
  }

  await requestOtp(verifier, auth, { email: 'ada@example.com', captchaToken: 'captcha', ipAddress: '127.0.0.1', name: 'Ada' })
  await requestMagicLink(verifier, auth, { email: 'ada@example.com', captchaToken: 'captcha', ipAddress: '127.0.0.1', redirectTo: 'http://localhost/auth/confirm' })
  const result = await verifyOtp(verifier, auth, { email: 'ada@example.com', token: '123456', captchaToken: 'captcha', ipAddress: '127.0.0.1' })

  assert.deepEqual(calls, ['verify', 'otp:ada@example.com', 'verify', 'magic:ada@example.com', 'verify', 'verifyOtp'])
  assert.equal(result.user.id, 'user')
})
