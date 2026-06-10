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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeHtmlWithLineBreaks(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>')
}

function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function contactEmailStyles(): string {
  return `
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 10px !important; }
          .content { padding: 20px !important; }
          .field, .info-box { padding: 15px !important; }
        }
      </style>`
}

export function createAdminContactEmail(formData: ContactFormData, timestamp: string): ContactEmailMessage {
  const name = escapeHtml(formData.name)
  const email = escapeHtml(formData.email)
  const subject = escapeHtml(formData.subject)
  const message = escapeHtmlWithLineBreaks(formData.message)
  const submittedAt = escapeHtml(timestamp)

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
      `Submitted At: ${timestamp}`
    ].join('\n'),
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>${contactEmailStyles()}
    </head>
    <body style="background-color: #2d2d2d; color: #f2f2f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #363636; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); overflow: hidden; border: 1px solid #3c3c3c;">
        <div style="background: linear-gradient(135deg, #363636 0%, #404040 100%); border-top: 4px solid #e0f2fe; color: #f2f2f2; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 0;">SAAD Portfolio</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">New Contact Form Submission</p>
        </div>

        <div class="content" style="padding: 32px; background-color: #363636;">
          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #404040; border-radius: 12px; border-left: 4px solid #e0f2fe; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #c4c4c4; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Name</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${name}</div>
          </div>

          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #404040; border-radius: 12px; border-left: 4px solid #e0f2fe; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #c4c4c4; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Email</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${email}</div>
          </div>

          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #404040; border-radius: 12px; border-left: 4px solid #e0f2fe; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #c4c4c4; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Subject</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${subject}</div>
          </div>

          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #363636; border-radius: 12px; border-left: 4px solid #3b82f6; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #c4c4c4; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Message</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${message}</div>
          </div>

          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #404040; border-radius: 12px; border-left: 4px solid #eab308; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #f2f2f2; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Submitted At</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${submittedAt}</div>
          </div>
        </div>

        <div style="background-color: #404040; padding: 24px; text-align: center; border-top: 1px solid #3c3c3c;">
          <p style="margin: 0; color: #c4c4c4; font-size: 14px;">This email was sent from your SAAD portfolio contact form.</p>
        </div>
      </div>
    </body>
    </html>
  `
  }
}

export function createUserContactConfirmationEmail(formData: ContactFormData): ContactEmailMessage {
  const name = escapeHtml(formData.name)
  const subject = escapeHtml(formData.subject)

  return {
    subject: 'Message Received - Thank You for Contacting Me!',
    text: [
      `Hi ${formData.name},`,
      '',
      "Thank you for reaching out! I've successfully received your message and wanted to confirm that it's in my inbox.",
      '',
      'Your Message Summary:',
      `Subject: ${formData.subject}`,
      '',
      "What's Next?",
      "I typically respond to messages within 24-48 hours. I'll review your message carefully and get back to you soon with a thoughtful response.",
      '',
      'Best regards,',
      'Mudabbirul Saad'
    ].join('\n'),
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message Received - SAAD Portfolio</title>${contactEmailStyles()}
    </head>
    <body style="background-color: #2d2d2d; color: #f2f2f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #363636; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); overflow: hidden; border: 1px solid #3c3c3c;">
        <div style="background: linear-gradient(135deg, #363636 0%, #404040 100%); border-top: 4px solid #22c55e; color: #f2f2f2; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 0;">SAAD</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Message Received Successfully</p>
        </div>

        <div class="content" style="padding: 32px; background-color: #363636;">
          <div style="font-size: 18px; color: #f2f2f2; margin-bottom: 24px; font-weight: 600;">
            Hi ${name},
          </div>

          <p style="margin-bottom: 24px; color: #c4c4c4;">Thank you for reaching out! I've successfully received your message and wanted to confirm that it's in my inbox.</p>

          <div class="info-box" style="background-color: #404040; border: 1px solid #3c3c3c; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin: 0 0 12px 0; color: #f2f2f2; font-size: 16px; font-weight: 600;">Your Message Summary:</h3>
            <p style="margin: 0; color: #c4c4c4;"><strong>Subject:</strong> ${subject}</p>
          </div>

          <div class="info-box" style="background-color: #363636; border: 1px solid #3c3c3c; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #e0f2fe;">
            <h3 style="margin: 0 0 12px 0; color: #f2f2f2; font-size: 16px; font-weight: 600;">What's Next?</h3>
            <p style="margin: 0; color: #c4c4c4;">I typically respond to messages within 24-48 hours. I'll review your message carefully and get back to you soon with a thoughtful response.</p>
          </div>

          <div style="margin: 16px 0;">
            <p style="color: #c4c4c4; margin-bottom: 12px;">In the meantime, feel free to:</p>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="color: #c4c4c4; margin-bottom: 8px;">- Check out my latest projects on <a href="https://github.com/mudabbirulsaad" style="color: #e0f2fe; text-decoration: none; font-weight: 500;">GitHub</a></li>
              <li style="color: #c4c4c4; margin-bottom: 8px;">- Connect with me on <a href="https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/" style="color: #e0f2fe; text-decoration: none; font-weight: 500;">LinkedIn</a></li>
              <li style="color: #c4c4c4;">- Follow my journey on social media</li>
            </ul>
          </div>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3c3c3c; color: #c4c4c4;">
            <p style="margin: 0;">Best regards,<br>
            <strong style="color: #f2f2f2;">Mudabbirul Saad</strong><br>
            AI Student & Developer<br>
            Swinburne University of Technology</p>
          </div>
        </div>

        <div style="background-color: #404040; padding: 24px; text-align: center; border-top: 1px solid #3c3c3c;">
          <p style="margin: 0; color: #c4c4c4; font-size: 14px;">This is an automated confirmation email from SAAD Portfolio.</p>
        </div>
      </div>
    </body>
    </html>
  `
  }
}

export function createContactEmailContent(formData: ContactFormData, timestamp: string): ContactEmailContentPair {
  return {
    admin: createAdminContactEmail(formData, timestamp),
    user: createUserContactConfirmationEmail(formData)
  }
}
