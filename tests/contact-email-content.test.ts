import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createAdminContactEmail,
  createContactEmailContent,
  createUserContactConfirmationEmail
} from '../lib/server/application/contact/contact-email-content'
import {
  createContactEmailNotifier,
  type ContactEmailEnvelope,
  type ContactEmailSender
} from '../lib/server/adapters/email/contact-email-notifier'
import type { ContactFormData } from '../lib/server/application/contact/contact-submission'

const formData: ContactFormData = {
  name: 'Ada <script>alert("x")</script>',
  email: 'ada@example.com',
  subject: 'Project <img src=x onerror=alert(1)>',
  message: 'Hello <strong>world</strong>\nSecond line & details'
}

function styleTagCount(html: string) {
  return {
    open: html.match(/<style\b/gi)?.length ?? 0,
    close: html.match(/<\/style>/gi)?.length ?? 0
  }
}

test('admin contact email escapes submitted content and includes a text fallback', () => {
  const email = createAdminContactEmail(formData, '10 June 2026 at 11:30 am')

  assert.equal(email.subject, 'New Contact Form Submission: Project <img src=x onerror=alert(1)>')
  assert.equal(email.replyTo, 'ada@example.com')
  assert.match(email.text, /Hello <strong>world<\/strong>/)
  assert.match(email.text, /10 June 2026/)

  assert.match(email.html, /Ada &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/)
  assert.match(email.html, /Project &lt;img src=x onerror=alert\(1\)&gt;/)
  assert.match(email.html, /Hello &lt;strong&gt;world&lt;\/strong&gt;<br>Second line &amp; details/)
  assert.doesNotMatch(email.html, /<script>/i)
})

test('user confirmation email escapes submitted content and includes a text fallback', () => {
  const email = createUserContactConfirmationEmail(formData)

  assert.equal(email.subject, 'Message Received - Thank You for Contacting Me!')
  assert.match(email.text, /Project <img src=x onerror=alert\(1\)>/)
  assert.match(email.html, /Hi Ada &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/)
  assert.match(email.html, /Subject:<\/strong> Project &lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(email.html, /<script>/i)
})

test('contact email html uses balanced style tags and no script tags', () => {
  const content = createContactEmailContent(formData, '10 June 2026')
  const adminStyleTags = styleTagCount(content.admin.html)
  const userStyleTags = styleTagCount(content.user.html)

  assert.equal(adminStyleTags.open, adminStyleTags.close)
  assert.equal(userStyleTags.open, userStyleTags.close)
  assert.doesNotMatch(content.admin.html, /<script>/i)
  assert.doesNotMatch(content.user.html, /<script>/i)
})

test('contact email notifier sends html and text bodies through the transport', async () => {
  const sent: ContactEmailEnvelope[] = []
  const sender: ContactEmailSender = {
    async send(message) {
      sent.push(message)
    }
  }

  const notifier = createContactEmailNotifier({
    gmailUser: 'portfolio@example.com',
    gmailPass: 'app-password',
    adminEmail: 'admin@example.com'
  }, sender)

  const result = await notifier.sendContactNotifications(formData)

  assert.equal(result.success, true)
  assert.equal(result.adminEmailSent, true)
  assert.equal(result.userEmailSent, true)
  assert.equal(sent.length, 2)

  assert.equal(sent[0].to, 'admin@example.com')
  assert.equal(sent[0].from, '"SAAD Portfolio" <portfolio@example.com>')
  assert.equal(sent[0].replyTo, 'ada@example.com')
  assert.match(sent[0].subject, /New Contact Form Submission/)
  assert.match(sent[0].html, /New Contact Form Submission/)
  assert.match(sent[0].text, /Hello <strong>world<\/strong>/)

  assert.equal(sent[1].to, 'ada@example.com')
  assert.equal(sent[1].from, '"Mudabbirul Saad" <portfolio@example.com>')
  assert.match(sent[1].html, /Message Received Successfully/)
  assert.match(sent[1].text, /Thank you for reaching out/)
})
