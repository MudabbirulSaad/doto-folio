import {
  escapeHtml,
  escapeHtmlWithLineBreaks,
  renderBodyText,
  renderButton,
  renderField,
  renderPanel,
  renderPortfolioEmail,
  renderSectionHeading
} from '@/lib/server/application/email-template'
import type { ContactFormData } from '@/lib/server/application/contact/contact-submission'

export interface ContactEmailMessage {
  subject: string
  html: string
  text: string
  replyTo?: string
}

export interface ContactEmailContentPair {
  admin: ContactEmailMessage
  user: ContactEmailMessage
}

function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export function createAdminContactEmail(formData: ContactFormData, timestamp: string): ContactEmailMessage {
  const name = escapeHtml(formData.name)
  const email = escapeHtml(formData.email)
  const subject = escapeHtml(formData.subject)
  const message = escapeHtmlWithLineBreaks(formData.message)
  const submittedAt = escapeHtml(timestamp)

  const details = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
    ${renderField('Name', name)}
    ${renderField('Email', email)}
    ${renderField('Subject', subject)}
    ${renderField('Submitted At', submittedAt)}
  </table>`

  const body = [
    renderPanel(`${renderSectionHeading('Submission Details')}${details}`),
    renderPanel(`${renderSectionHeading('Message')}${renderBodyText(message)}`),
    renderPanel(`${renderSectionHeading('Reply cue')}${renderBodyText(`Reply directly to this email to reach ${name} at ${email}.`)}`)
  ].join('')

  return {
    subject: `New Contact Form Submission: ${headerSafe(formData.subject)}`,
    replyTo: formData.email,
    text: [
      'New Contact Form Submission',
      '',
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Subject: ${formData.subject}`,
      '',
      'Message:',
      formData.message,
      '',
      `Submitted At: ${timestamp}`,
      '',
      'Reply directly to this email to reach the sender.'
    ].join('\n'),
    html: renderPortfolioEmail({
      title: 'New Contact Form Submission',
      preheader: `New message from ${formData.name}: ${formData.subject}`,
      heading: 'New Contact Form Submission',
      eyebrow: 'A portfolio visitor sent a message through the contact form.',
      body,
      footerNote: 'This email was sent from your SAAD portfolio contact form.'
    })
  }
}

export function createUserContactConfirmationEmail(formData: ContactFormData): ContactEmailMessage {
  const name = escapeHtml(formData.name)
  const subject = escapeHtml(formData.subject)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mudabbirulsaad.com'
  const blogUrl = `${siteUrl}/blog`

  const summary = renderPanel(`${renderSectionHeading('Your Message Summary')}${renderBodyText(`<strong style="color: #f2f2ef;">Subject:</strong> ${subject}`)}`)
  const next = renderPanel(`${renderSectionHeading("What's Next?")}${renderBodyText("I usually respond within 24-48 hours. I will read your note carefully and get back to you with a thoughtful reply.")}`)
  const body = [
    renderBodyText(`Hi ${name},`),
    renderBodyText("I got your message. Thank you for reaching out, it is now safely in my inbox."),
    summary,
    next,
    renderBodyText('In the meantime, you can browse the latest articles and project notes from the portfolio.'),
    renderButton(blogUrl, 'Browse Latest Articles'),
    `<p style="margin: 28px 0 0; color: #c7c2b7; font-size: 15px; line-height: 1.65;">Best regards,<br><strong style="color: #f2f2ef;">Mudabbirul Saad</strong><br>AI Student & Developer</p>`
  ].join('')

  return {
    subject: 'Message Received - Thank You for Contacting Me!',
    text: [
      `Hi ${formData.name},`,
      '',
      'I got your message. Thank you for reaching out, it is now safely in my inbox.',
      '',
      'Your Message Summary:',
      `Subject: ${formData.subject}`,
      '',
      "What's Next?",
      'I typically respond to messages within 24-48 hours. I will review your message carefully and get back to you soon with a thoughtful response.',
      '',
      'Browse latest articles:',
      blogUrl,
      '',
      'Best regards,',
      'Mudabbirul Saad'
    ].join('\n'),
    html: renderPortfolioEmail({
      title: 'Message Received - SAAD Portfolio',
      preheader: 'I got your message and will reply soon.',
      heading: 'Message Received Successfully',
      eyebrow: 'Thanks for starting the conversation.',
      body,
      footerNote: 'This is an automated confirmation email from SAAD Portfolio.'
    })
  }
}

export function createContactEmailContent(formData: ContactFormData, timestamp: string): ContactEmailContentPair {
  return {
    admin: createAdminContactEmail(formData, timestamp),
    user: createUserContactConfirmationEmail(formData)
  }
}
