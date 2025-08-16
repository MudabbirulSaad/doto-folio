import nodemailer from 'nodemailer'
import type { ContactFormData } from './contact'

export interface EmailConfig {
  gmailUser: string
  gmailPass: string
  adminEmail: string
}

export interface EmailResult {
  success: boolean
  error?: string
  adminEmailSent?: boolean
  userEmailSent?: boolean
}

// Create reusable transporter
function createTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmailUser,
      pass: config.gmailPass,
    },
    secure: true,
    tls: {
      rejectUnauthorized: false
    }
  })
}

// SAAD Portfolio Dark Theme Color Palette (exact colors from app/globals.css converted to hex for email compatibility)
const COLORS = {
  // Dark theme colors from globals.css
  background: '#2d2d2d',        // oklch(0.1776 0 0) - Dark background
  foreground: '#f2f2f2',        // oklch(0.9491 0 0) - Light text
  card: '#363636',              // oklch(0.2134 0 0) - Card background
  cardForeground: '#f2f2f2',    // oklch(0.9491 0 0) - Card text
  primary: '#93c5fd',           // oklch(0.9247 0.0524 66.1732) - Primary accent (light blue)
  primaryForeground: '#1e293b',  // oklch(0.2029 0.0240 200.1962) - Primary text
  secondary: '#4b5563',         // oklch(0.3163 0.0190 63.6992) - Secondary color
  secondaryForeground: '#93c5fd', // oklch(0.9247 0.0524 66.1732) - Secondary text
  muted: '#404040',             // oklch(0.2520 0 0) - Muted background
  mutedForeground: '#c4c4c4',   // oklch(0.7699 0 0) - Muted text
  accent: '#2a2a2a',            // oklch(28.502% 0.00003 271.152) - Accent background
  accentForeground: '#f2f2f2',  // oklch(0.9491 0 0) - Accent text
  border: '#3c3c3c',            // oklch(0.2351 0.0115 91.7467) - Border color

  // Additional semantic colors (adjusted for dark theme)
  success: '#22c55e',           // Green for success states
  warning: '#f59e0b',           // Orange for warnings
  info: '#3b82f6',              // Blue for info
  destructive: '#ef4444',       // Red for errors
}

// Email templates with SAAD portfolio branding using exact color palette
function getAdminEmailTemplate(formData: ContactFormData, timestamp: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=Besley:ital,wght@0,400..900;1,400..900&display=swap');

        body {
          font-family: 'Doto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: ${COLORS.foreground};
          background-color: ${COLORS.background};
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: ${COLORS.card};
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid ${COLORS.border};
        }
        .header {
          background: linear-gradient(135deg, ${COLORS.card} 0%, ${COLORS.muted} 100%);
          border-top: 3px solid ${COLORS.primary};
          color: ${COLORS.foreground};
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.025em;
          font-family: 'Doto', sans-serif;
        }
        .header p {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
          font-family: 'Doto', sans-serif;
        }
        .content {
          padding: 32px 24px;
          background: ${COLORS.card};
        }
        .content p {
          font-family: 'Besley', serif;
        }
        .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
          font-family: 'Doto', sans-serif;
        }
        .field {
          margin-bottom: 24px;
          padding: 20px;
          background: ${COLORS.muted};
          border-radius: 12px;
          border-left: 4px solid ${COLORS.primary};
          border: 1px solid ${COLORS.border};
        }
        .field-label {
          font-weight: 600;
          color: ${COLORS.mutedForeground};
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          font-family: 'Doto', sans-serif;
        }
        .field-value {
          color: ${COLORS.foreground};
          font-size: 16px;
          word-wrap: break-word;
          font-family: 'Besley', serif;
        }
        .message-field {
          background: ${COLORS.accent};
          border-left-color: ${COLORS.info};
          border-color: ${COLORS.border};
        }
        .footer {
          background: ${COLORS.muted};
          padding: 24px;
          text-align: center;
          border-top: 1px solid ${COLORS.border};
        }
        .footer p {
          margin: 0;
          color: ${COLORS.mutedForeground};
          font-size: 14px;
          font-family: 'Doto', sans-serif;
        }
        .timestamp {
          background: ${COLORS.secondary};
          border-left-color: ${COLORS.warning};
          border-color: ${COLORS.border};
          font-family: 'Besley', serif;
        }
        .timestamp .field-label {
          color: ${COLORS.foreground};
        }
        .timestamp .field-value {
          color: ${COLORS.foreground};
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SAAD Portfolio</h1>
          <p>New Contact Form Submission</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Name</div>
            <div class="field-value">${formData.name}</div>
          </div>
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value">${formData.email}</div>
          </div>
          <div class="field">
            <div class="field-label">Subject</div>
            <div class="field-value">${formData.subject}</div>
          </div>
          <div class="field message-field">
            <div class="field-label">Message</div>
            <div class="field-value">${formData.message.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="field timestamp">
            <div class="field-label">Submitted At</div>
            <div class="field-value">${timestamp}</div>
          </div>
        </div>
        <div class="footer">
          <p>This email was sent from your SAAD portfolio contact form.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getUserConfirmationTemplate(formData: ContactFormData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message Received - SAAD Portfolio</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=Besley:ital,wght@0,400..900;1,400..900&display=swap');

        body {
          font-family: 'Doto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: ${COLORS.foreground};
          background-color: ${COLORS.background};
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: ${COLORS.card};
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid ${COLORS.border};
        }
        .header {
          background: linear-gradient(135deg, ${COLORS.card} 0%, ${COLORS.muted} 100%);
          border-top: 3px solid ${COLORS.success};
          color: ${COLORS.foreground};
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.025em;
          font-family: 'Doto', sans-serif;
        }
        .header p {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
          font-family: 'Doto', sans-serif;
        }
        .content {
          padding: 32px 24px;
          background: ${COLORS.card};
        }
        .content p {
          font-family: 'Besley', serif;
        }
        .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
          font-family: 'Doto', sans-serif;
        }
        .greeting {
          font-size: 18px;
          color: ${COLORS.foreground};
          margin-bottom: 24px;
          font-weight: 600;
          font-family: 'Besley', serif;
        }
        .message-summary {
          background: ${COLORS.muted};
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          border-left: 4px solid ${COLORS.success};
        }
        .message-summary h3 {
          margin: 0 0 12px 0;
          color: ${COLORS.foreground};
          font-size: 16px;
          font-weight: 600;
          font-family: 'Doto', sans-serif;
        }
        .message-summary p {
          margin: 0;
          color: ${COLORS.mutedForeground};
          font-family: 'Besley', serif;
        }
        .response-info {
          background: ${COLORS.accent};
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          border-left: 4px solid ${COLORS.primary};
        }
        .response-info h3 {
          margin: 0 0 12px 0;
          color: ${COLORS.foreground};
          font-size: 16px;
          font-weight: 600;
          font-family: 'Doto', sans-serif;
        }
        .response-info p {
          margin: 0;
          color: ${COLORS.mutedForeground};
          font-family: 'Besley', serif;
        }
        .footer {
          background: ${COLORS.muted};
          padding: 24px;
          text-align: center;
          border-top: 1px solid ${COLORS.border};
        }
        .footer p {
          margin: 0;
          color: ${COLORS.mutedForeground};
          font-size: 14px;
          font-family: 'Doto', sans-serif;
        }
        .signature {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid ${COLORS.border};
          color: ${COLORS.mutedForeground};
          font-family: 'Besley', serif;
        }
        .links {
          margin: 16px 0;
          font-family: 'Besley', serif;
        }
        .links a {
          color: ${COLORS.primary};
          text-decoration: none;
          font-weight: 500;
          font-family: 'Doto', sans-serif;
        }
        .links a:hover {
          text-decoration: underline;
        }
        .links ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .links li {
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SAAD</h1>
          <p>Message Received Successfully</p>
        </div>
        <div class="content">
          <div class="greeting">
            Hi ${formData.name},
          </div>
          <p>Thank you for reaching out! I've successfully received your message and wanted to confirm that it's in my inbox.</p>
          
          <div class="message-summary">
            <h3>Your Message Summary:</h3>
            <p><strong>Subject:</strong> ${formData.subject}</p>
          </div>
          
          <div class="response-info">
            <h3>What's Next?</h3>
            <p>I typically respond to messages within 24-48 hours. I'll review your message carefully and get back to you soon with a thoughtful response.</p>
          </div>
          
          <div class="links">
            <p>In the meantime, feel free to:</p>
            <ul>
              <li>Check out my latest projects on <a href="https://github.com/mudabbirulsaad">GitHub</a></li>
              <li>Connect with me on <a href="https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/">LinkedIn</a></li>
              <li>Follow my journey on social media</li>
            </ul>
          </div>
          
          <div class="signature">
            <p>Best regards,<br>
            <strong>Mudabbirul Saad</strong><br>
            AI Student & Developer<br>
            Swinburne University of Technology</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email from SAAD Portfolio.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendContactEmails(
  formData: ContactFormData,
  config: EmailConfig
): Promise<EmailResult> {
  try {
    const transporter = createTransporter(config)
    const timestamp = new Date().toLocaleString('en-AU', {
      timeZone: 'Australia/Melbourne',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    let adminEmailSent = false
    let userEmailSent = false
    const errors: string[] = []

    // Send admin notification email
    try {
      await transporter.sendMail({
        from: `"SAAD Portfolio" <${config.gmailUser}>`,
        to: config.adminEmail,
        subject: `New Contact Form Submission: ${formData.subject}`,
        html: getAdminEmailTemplate(formData, timestamp),
        replyTo: formData.email,
      })
      adminEmailSent = true
    } catch (error) {
      console.error('Failed to send admin email:', error)
      errors.push('Failed to send admin notification')
    }

    // Send user confirmation email
    try {
      await transporter.sendMail({
        from: `"Mudabbirul Saad" <${config.gmailUser}>`,
        to: formData.email,
        subject: 'Message Received - Thank You for Contacting Me!',
        html: getUserConfirmationTemplate(formData),
      })
      userEmailSent = true
    } catch (error) {
      console.error('Failed to send user confirmation email:', error)
      errors.push('Failed to send confirmation email')
    }

    // Return success if at least one email was sent
    const success = adminEmailSent || userEmailSent
    
    return {
      success,
      adminEmailSent,
      userEmailSent,
      error: errors.length > 0 ? errors.join(', ') : undefined
    }

  } catch (error) {
    console.error('Email service error:', error)
    return {
      success: false,
      error: 'Email service unavailable',
      adminEmailSent: false,
      userEmailSent: false
    }
  }
}
