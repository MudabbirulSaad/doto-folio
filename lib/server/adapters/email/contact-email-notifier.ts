import nodemailer from 'nodemailer'
import {
  createContactEmailContent,
  type ContactEmailMessage
} from '@/lib/server/application/contact/contact-email-content'
import type {
  ContactEmailNotifier,
  ContactEmailResult
} from '@/lib/server/application/contact/contact-submission'

export interface ContactEmailConfig {
  gmailUser: string
  gmailPass: string
  adminEmail: string
}

export interface ContactEmailEnvelope extends ContactEmailMessage {
  from: string
  to: string
}

export interface ContactEmailSender {
  send(message: ContactEmailEnvelope): Promise<void>
}

function createTransporter(config: ContactEmailConfig) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmailUser,
      pass: config.gmailPass
    },
    secure: true,
    tls: {
      rejectUnauthorized: false
    }
  })
}

function createNodemailerContactEmailSender(config: ContactEmailConfig): ContactEmailSender {
  const transporter = createTransporter(config)

  return {
    async send(message) {
      await transporter.sendMail(message)
    }
  }
}

function contactTimestamp(): string {
  return new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function createContactEmailNotifier(
  config: ContactEmailConfig,
  sender: ContactEmailSender = createNodemailerContactEmailSender(config)
): ContactEmailNotifier {
  return {
    async sendContactNotifications(formData): Promise<ContactEmailResult> {
      const content = createContactEmailContent(formData, contactTimestamp())
      let adminEmailSent = false
      let userEmailSent = false
      const errors: string[] = []

      try {
        await sender.send({
          from: `"SAAD Portfolio" <${config.gmailUser}>`,
          to: config.adminEmail,
          ...content.admin
        })
        adminEmailSent = true
      } catch (error) {
        console.error('Failed to send admin email:', error)
        errors.push('Failed to send admin notification')
      }

      try {
        await sender.send({
          from: `"Mudabbirul Saad" <${config.gmailUser}>`,
          to: formData.email,
          ...content.user
        })
        userEmailSent = true
      } catch (error) {
        console.error('Failed to send user confirmation email:', error)
        errors.push('Failed to send confirmation email')
      }

      return {
        success: adminEmailSent || userEmailSent,
        adminEmailSent,
        userEmailSent,
        error: errors.length > 0 ? errors.join(', ') : undefined
      }
    }
  }
}
