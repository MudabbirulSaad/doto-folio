import nodemailer from 'nodemailer'
import {
  escapeHtml,
  renderBodyText,
  renderButton,
  renderMutedLink,
  renderPanel,
  renderPortfolioEmail,
  renderSectionHeading
} from '@/lib/server/application/email-template'

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

export function getSubscriptionWelcomeTemplate(name: string, email: string): string {
  const safeName = escapeHtml(name || 'there')
  const blogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog`
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}`

  const featureRows = [
    ['AI notes', 'Readable observations on models, tools, research ideas, and what they mean in practice.'],
    ['Build logs', 'Honest notes from portfolio, app, and full-stack experiments as they take shape.'],
    ['Technical essays', 'Occasional deep dives on development, product thinking, and useful patterns.']
  ].map(([label, description]) => `<tr>
    <td width="18" valign="top" style="padding: 10px 12px 10px 0;">
      <span style="display: inline-block; width: 8px; height: 8px; background-color: #ead99f; border-radius: 8px;"></span>
    </td>
    <td style="padding: 8px 0;">
      <p style="margin: 0 0 3px; color: #f2f2ef; font-size: 15px; font-weight: 700;">${label}</p>
      <p style="margin: 0; color: #c7c2b7; font-size: 14px; line-height: 1.55;">${description}</p>
    </td>
  </tr>`).join('')

  const body = [
    renderBodyText(`Hi ${safeName}, thanks for subscribing. You will get a calm, useful note when I publish something worth your time.`),
    renderPanel(`${renderSectionHeading('What to expect')}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">${featureRows}</table>`),
    renderBodyText('No noise, no daily churn. Just AI notes, build logs, technical essays, and occasional project updates from the portfolio.'),
    renderButton(blogUrl, 'Browse Latest Articles'),
    `<p style="margin: 22px 0 0; color: #8e887d; font-size: 12px; line-height: 1.6;">Need out? ${renderMutedLink(unsubscribeUrl, 'Unsubscribe here')}.</p>`
  ].join('')

  return renderPortfolioEmail({
    title: 'Welcome to SAAD Newsletter',
    preheader: 'You are on the list for AI notes, build logs, and technical essays.',
    heading: 'Welcome to the Newsletter',
    eyebrow: 'AI notes, build logs, and thoughtful technical essays.',
    body,
    footerNote: `You are receiving this because you subscribed to SAAD Newsletter. ${renderMutedLink(unsubscribeUrl, 'Unsubscribe')}`
  })
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
