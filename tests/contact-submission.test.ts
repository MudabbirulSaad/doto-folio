import test from 'node:test'
import assert from 'node:assert/strict'
import { submitContactMessage, type ContactEmailNotifier, type ContactSubmissionRepository } from '../lib/server/application/contact/contact-submission'

function repository(): ContactSubmissionRepository & { saved: Array<Record<string, string>> } {
  return {
    saved: [],
    async saveSubmission(data) {
      this.saved.push(data)
      return { id: 'submission-1', ...data }
    }
  }
}

test('submitContactMessage normalizes email, persists the submission, and sends configured emails', async () => {
  const submissions = repository()
  const notifier: ContactEmailNotifier = {
    async sendContactNotifications(formData) {
      assert.equal(formData.email, 'person@example.com')
      return {
        success: true,
        adminEmailSent: true,
        userEmailSent: true
      }
    }
  }

  const result = await submitContactMessage(submissions, notifier, {
    name: 'Ada',
    email: 'PERSON@EXAMPLE.COM',
    subject: 'Project chat',
    message: 'Hello there'
  })

  assert.deepEqual(submissions.saved[0], {
    name: 'Ada',
    email: 'person@example.com',
    subject: 'Project chat',
    message: 'Hello there'
  })
  assert.equal(result.submission.id, 'submission-1')
  assert.equal(result.emailStatus, 'Email notifications: admin notification sent, confirmation email sent')
})

test('submitContactMessage does not fail the submission when optional email notifications fail', async () => {
  const submissions = repository()

  const result = await submitContactMessage(submissions, {
    async sendContactNotifications() {
      return {
        success: false,
        error: 'SMTP unavailable'
      }
    }
  }, {
    name: 'Ada',
    email: 'ada@example.com',
    subject: 'Project chat',
    message: 'Hello there'
  })

  assert.equal(result.submission.id, 'submission-1')
  assert.equal(result.emailStatus, 'Email notifications failed: SMTP unavailable')
})

test('submitContactMessage reports disabled email notifications when no notifier is configured', async () => {
  const result = await submitContactMessage(repository(), null, {
    name: 'Ada',
    email: 'ada@example.com',
    subject: 'Project chat',
    message: 'Hello there'
  })

  assert.equal(result.emailStatus, 'Email notifications disabled')
})
