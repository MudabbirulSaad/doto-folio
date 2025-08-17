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

export interface SubscriptionEmailResult {
  success: boolean
  error?: string
  welcomeEmailSent?: boolean
  adminNotificationSent?: boolean
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

// Email templates now use inline CSS with exact dark theme colors from app/globals.css (email client compatible)

// Email templates with SAAD portfolio branding using inline CSS (email client compatible)
function getAdminEmailTemplate(formData: ContactFormData, timestamp: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <script>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 10px !important; }
          .content { padding: 20px !important; }
          .field { padding: 15px !important; }
        }
      </style>
    </head>
    <body style="background-color: #2d2d2d; color: #f2f2f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #363636; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); overflow: hidden; border: 1px solid #3c3c3c;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #363636 0%, #404040 100%); border-top: 4px solid #e0f2fe; color: #f2f2f2; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.025em;">SAAD Portfolio</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">New Contact Form Submission</p>
        </div>

        <!-- Content -->
        <div class="content" style="padding: 32px; background-color: #363636;">
          <!-- Name Field -->
          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #404040; border-radius: 12px; border-left: 4px solid #e0f2fe; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #c4c4c4; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Name</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${formData.name}</div>
          </div>

          <!-- Email Field -->
          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #404040; border-radius: 12px; border-left: 4px solid #e0f2fe; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #c4c4c4; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Email</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${formData.email}</div>
          </div>

          <!-- Subject Field -->
          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #404040; border-radius: 12px; border-left: 4px solid #e0f2fe; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #c4c4c4; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Subject</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${formData.subject}</div>
          </div>

          <!-- Message Field -->
          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #363636; border-radius: 12px; border-left: 4px solid #3b82f6; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #c4c4c4; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Message</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${formData.message.replace(/\n/g, '<br>')}</div>
          </div>

          <!-- Timestamp Field -->
          <div class="field" style="margin-bottom: 24px; padding: 20px; background-color: #404040; border-radius: 12px; border-left: 4px solid #eab308; border: 1px solid #3c3c3c;">
            <div style="font-weight: 600; color: #f2f2f2; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Submitted At</div>
            <div style="color: #f2f2f2; font-size: 16px; word-break: break-word;">${timestamp}</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #404040; padding: 24px; text-align: center; border-top: 1px solid #3c3c3c;">
          <p style="margin: 0; color: #c4c4c4; font-size: 14px;">This email was sent from your SAAD portfolio contact form.</p>
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
      <script>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 10px !important; }
          .content { padding: 20px !important; }
          .info-box { padding: 15px !important; }
        }
      </style>
    </head>
    <body style="background-color: #2d2d2d; color: #f2f2f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #363636; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); overflow: hidden; border: 1px solid #3c3c3c;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #363636 0%, #404040 100%); border-top: 4px solid #22c55e; color: #f2f2f2; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.025em;">SAAD</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Message Received Successfully</p>
        </div>

        <!-- Content -->
        <div class="content" style="padding: 32px; background-color: #363636;">
          <!-- Greeting -->
          <div style="font-size: 18px; color: #f2f2f2; margin-bottom: 24px; font-weight: 600;">
            Hi ${formData.name},
          </div>

          <p style="margin-bottom: 24px; color: #c4c4c4;">Thank you for reaching out! I've successfully received your message and wanted to confirm that it's in my inbox.</p>

          <!-- Message Summary -->
          <div class="info-box" style="background-color: #404040; border: 1px solid #3c3c3c; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin: 0 0 12px 0; color: #f2f2f2; font-size: 16px; font-weight: 600;">Your Message Summary:</h3>
            <p style="margin: 0; color: #c4c4c4;"><strong>Subject:</strong> ${formData.subject}</p>
          </div>

          <!-- Response Info -->
          <div class="info-box" style="background-color: #363636; border: 1px solid #3c3c3c; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #e0f2fe;">
            <h3 style="margin: 0 0 12px 0; color: #f2f2f2; font-size: 16px; font-weight: 600;">What's Next?</h3>
            <p style="margin: 0; color: #c4c4c4;">I typically respond to messages within 24-48 hours. I'll review your message carefully and get back to you soon with a thoughtful response.</p>
          </div>

          <!-- Links -->
          <div style="margin: 16px 0;">
            <p style="color: #c4c4c4; margin-bottom: 12px;">In the meantime, feel free to:</p>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="color: #c4c4c4; margin-bottom: 8px;">• Check out my latest projects on <a href="https://github.com/mudabbirulsaad" style="color: #e0f2fe; text-decoration: none; font-weight: 500;">GitHub</a></li>
              <li style="color: #c4c4c4; margin-bottom: 8px;">• Connect with me on <a href="https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/" style="color: #e0f2fe; text-decoration: none; font-weight: 500;">LinkedIn</a></li>
              <li style="color: #c4c4c4;">• Follow my journey on social media</li>
            </ul>
          </div>

          <!-- Signature -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #3c3c3c; color: #c4c4c4;">
            <p style="margin: 0;">Best regards,<br>
            <strong style="color: #f2f2f2;">Mudabbirul Saad</strong><br>
            AI Student & Developer<br>
            Swinburne University of Technology</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #404040; padding: 24px; text-align: center; border-top: 1px solid #3c3c3c;">
          <p style="margin: 0; color: #c4c4c4; font-size: 14px;">This is an automated confirmation email from SAAD Portfolio.</p>
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

// Subscription Email Templates
function getSubscriptionWelcomeTemplate(name: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SAAD Newsletter</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .content { padding: 20px !important; }
            .feature-item { flex-direction: column !important; text-align: center !important; }
            .feature-icon { margin: 0 auto 10px auto !important; }
          }
        </style>
      </head>
      <body style="background-color: #2d2d2d; color: #f2f2f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0;">
        <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; padding: 40px 0; border-bottom: 1px solid #3c3c3c;">
            <div style="font-size: 24px; font-weight: bold; color: #e0f2fe; margin-bottom: 8px;">SAAD</div>
            <p style="color: #c4c4c4; font-size: 14px; margin: 0;">AI Student & Full-Stack Developer</p>
          </div>

          <!-- Content -->
          <div class="content" style="padding: 40px 0;">
            <h1 style="font-size: 28px; font-weight: bold; color: #f2f2f2; margin-bottom: 20px; text-align: center;">Welcome to the Newsletter! 🎉</h1>
            <p style="font-size: 16px; color: #c4c4c4; margin-bottom: 32px; text-align: center;">
              Hi ${name || 'there'}! Thank you for subscribing to my newsletter.
              You'll now receive updates whenever I publish new articles about AI, technology, and development.
            </p>

            <!-- Features -->
            <div style="background-color: #363636; border: 1px solid #3c3c3c; border-radius: 12px; padding: 32px; margin: 32px 0;">
              <div class="feature-item" style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                <div class="feature-icon" style="width: 20px; height: 20px; background-color: #e0f2fe; border-radius: 50%; margin-right: 16px; margin-top: 4px; flex-shrink: 0;"></div>
                <div>
                  <div style="font-weight: 600; color: #f2f2f2; margin-bottom: 4px;">Latest AI Insights</div>
                  <div style="color: #c4c4c4;">Deep dives into machine learning, AI trends, and practical applications</div>
                </div>
              </div>
              <div class="feature-item" style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                <div class="feature-icon" style="width: 20px; height: 20px; background-color: #e0f2fe; border-radius: 50%; margin-right: 16px; margin-top: 4px; flex-shrink: 0;"></div>
                <div>
                  <div style="font-weight: 600; color: #f2f2f2; margin-bottom: 4px;">Development Tutorials</div>
                  <div style="color: #c4c4c4;">Step-by-step guides on modern web development and best practices</div>
                </div>
              </div>
              <div class="feature-item" style="display: flex; align-items: flex-start;">
                <div class="feature-icon" style="width: 20px; height: 20px; background-color: #e0f2fe; border-radius: 50%; margin-right: 16px; margin-top: 4px; flex-shrink: 0;"></div>
                <div>
                  <div style="font-weight: 600; color: #f2f2f2; margin-bottom: 4px;">Tech Industry Updates</div>
                  <div style="color: #c4c4c4;">Analysis of the latest trends and technologies shaping our future</div>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog"
                 style="display: inline-block; background-color: #e0f2fe; color: #1e3a8a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;">
                Browse Latest Articles
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 32px 0; border-top: 1px solid #3c3c3c; color: #c4c4c4; font-size: 14px;">
            <p style="margin-bottom: 8px;">You're receiving this because you subscribed to SAAD Newsletter.</p>
            <p style="margin: 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}"
                 style="color: #c4c4c4; text-decoration: none; font-size: 12px;">
                Unsubscribe
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}



// Send subscription welcome email (no admin notification for subscriptions)
export async function sendSubscriptionWelcomeEmail(
  name: string,
  email: string,
  config: EmailConfig
): Promise<SubscriptionEmailResult> {
  try {
    const transporter = createTransporter(config)

    let welcomeEmailSent = false
    const errors: string[] = []

    // Send welcome email to subscriber only
    try {
      await transporter.sendMail({
        from: `"SAAD Newsletter" <${config.gmailUser}>`,
        to: email,
        subject: 'Welcome to SAAD Newsletter! 🚀',
        html: getSubscriptionWelcomeTemplate(name, email),
      })
      welcomeEmailSent = true
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      errors.push('Failed to send welcome email')
    }

    return {
      success: welcomeEmailSent,
      welcomeEmailSent,
      adminNotificationSent: false, // No admin notification for subscriptions
      error: errors.length > 0 ? errors.join(', ') : undefined
    }

  } catch (error) {
    console.error('Subscription email service error:', error)
    return {
      success: false,
      error: 'Email service unavailable',
      welcomeEmailSent: false,
      adminNotificationSent: false
    }
  }
}
