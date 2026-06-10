import nodemailer from 'nodemailer'

export interface EmailConfig {
  gmailUser: string
  gmailPass: string
  adminEmail: string
}

export interface SubscriptionEmailResult {
  success: boolean
  error?: string
  welcomeEmailSent?: boolean
  adminNotificationSent?: boolean
}

function createTransporter(config: EmailConfig) {
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getSubscriptionWelcomeTemplate(name: string, email: string): string {
  const safeName = escapeHtml(name || 'there')
  const blogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog`
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}`

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
          <div style="text-align: center; padding: 40px 0; border-bottom: 1px solid #3c3c3c;">
            <div style="font-size: 24px; font-weight: bold; color: #e0f2fe; margin-bottom: 8px;">SAAD</div>
            <p style="color: #c4c4c4; font-size: 14px; margin: 0;">AI Student & Full-Stack Developer</p>
          </div>

          <div class="content" style="padding: 40px 0;">
            <h1 style="font-size: 28px; font-weight: bold; color: #f2f2f2; margin-bottom: 20px; text-align: center;">Welcome to the Newsletter!</h1>
            <p style="font-size: 16px; color: #c4c4c4; margin-bottom: 32px; text-align: center;">
              Hi ${safeName}! Thank you for subscribing to my newsletter.
              You'll now receive updates whenever I publish new articles about AI, technology, and development.
            </p>

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

            <div style="text-align: center;">
              <a href="${blogUrl}" style="display: inline-block; background-color: #e0f2fe; color: #1e3a8a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;">
                Browse Latest Articles
              </a>
            </div>
          </div>

          <div style="text-align: center; padding: 32px 0; border-top: 1px solid #3c3c3c; color: #c4c4c4; font-size: 14px;">
            <p style="margin-bottom: 8px;">You're receiving this because you subscribed to SAAD Newsletter.</p>
            <p style="margin: 0;">
              <a href="${unsubscribeUrl}" style="color: #c4c4c4; text-decoration: none; font-size: 12px;">
                Unsubscribe
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function sendSubscriptionWelcomeEmail(
  name: string,
  email: string,
  config: EmailConfig
): Promise<SubscriptionEmailResult> {
  try {
    const transporter = createTransporter(config)

    await transporter.sendMail({
      from: `"SAAD Newsletter" <${config.gmailUser}>`,
      to: email,
      subject: 'Welcome to SAAD Newsletter!',
      html: getSubscriptionWelcomeTemplate(name, email)
    })

    return {
      success: true,
      welcomeEmailSent: true,
      adminNotificationSent: false
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
