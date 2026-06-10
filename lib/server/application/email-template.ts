export const portfolioEmailColors = {
  background: '#1d1d1d',
  surface: '#242424',
  panel: '#2d2b26',
  panelAlt: '#202020',
  border: '#3d3a32',
  text: '#f2f2ef',
  muted: '#c7c2b7',
  dim: '#8e887d',
  primary: '#ead99f',
  primaryText: '#211d14'
} as const

const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function escapeHtmlWithLineBreaks(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>')
}

function emailStyles(): string {
  return `
      <style>
        @media only screen and (max-width: 600px) {
          .email-shell { width: 100% !important; }
          .email-outer { padding: 16px 10px !important; }
          .email-content { padding: 24px 18px !important; }
          .email-header { padding: 28px 18px 22px !important; }
          .email-panel { padding: 16px !important; }
          .email-title { font-size: 24px !important; line-height: 1.22 !important; }
        }
      </style>`
}

export interface EmailLayoutOptions {
  title: string
  preheader: string
  eyebrow: string
  heading: string
  intro?: string
  body: string
  footerNote: string
}

export function renderPortfolioEmail(options: EmailLayoutOptions): string {
  const colors = portfolioEmailColors

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>${escapeHtml(options.title)}</title>${emailStyles()}
  </head>
  <body style="margin: 0; padding: 0; background-color: ${colors.background}; color: ${colors.text}; font-family: ${fontStack}; line-height: 1.6;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${escapeHtml(options.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${colors.background}; border-collapse: collapse;">
      <tr>
        <td class="email-outer" align="center" style="padding: 28px 12px;">
          <table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 600px; background-color: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 14px; border-collapse: separate; overflow: hidden;">
            <tr>
              <td class="email-header" style="padding: 34px 30px 26px; border-top: 4px solid ${colors.primary}; border-bottom: 1px solid ${colors.border}; text-align: left;">
                <p style="margin: 0 0 10px; color: ${colors.primary}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">SAAD Portfolio</p>
                <h1 class="email-title" style="margin: 0; color: ${colors.text}; font-size: 28px; line-height: 1.2; font-weight: 700; letter-spacing: 0;">${escapeHtml(options.heading)}</h1>
                <p style="margin: 10px 0 0; color: ${colors.muted}; font-size: 15px; line-height: 1.55;">${escapeHtml(options.eyebrow)}</p>
              </td>
            </tr>
            <tr>
              <td class="email-content" style="padding: 30px; background-color: ${colors.surface};">
                ${options.intro ? `<p style="margin: 0 0 22px; color: ${colors.muted}; font-size: 16px; line-height: 1.65;">${options.intro}</p>` : ''}
                ${options.body}
              </td>
            </tr>
            <tr>
              <td style="padding: 22px 30px; background-color: ${colors.panelAlt}; border-top: 1px solid ${colors.border}; text-align: center;">
                <p style="margin: 0; color: ${colors.dim}; font-size: 12px; line-height: 1.6;">${options.footerNote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function renderPanel(content: string): string {
  const colors = portfolioEmailColors

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-panel" style="width: 100%; background-color: ${colors.panel}; border: 1px solid ${colors.border}; border-radius: 12px; border-collapse: separate; margin: 0 0 18px;">
    <tr>
      <td class="email-panel" style="padding: 20px;">
        ${content}
      </td>
    </tr>
  </table>`
}

export function renderField(label: string, value: string): string {
  const colors = portfolioEmailColors

  return `<tr>
    <td style="padding: 14px 0; border-bottom: 1px solid ${colors.border};">
      <p style="margin: 0 0 5px; color: ${colors.dim}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(label)}</p>
      <p style="margin: 0; color: ${colors.text}; font-size: 15px; line-height: 1.6; word-break: break-word;">${value}</p>
    </td>
  </tr>`
}

export function renderBodyText(content: string): string {
  return `<p style="margin: 0 0 18px; color: ${portfolioEmailColors.muted}; font-size: 15px; line-height: 1.65;">${content}</p>`
}

export function renderSectionHeading(content: string): string {
  return `<h2 style="margin: 0 0 10px; color: ${portfolioEmailColors.text}; font-size: 17px; line-height: 1.35; font-weight: 700;">${content}</h2>`
}

export function renderButton(href: string, label: string): string {
  const colors = portfolioEmailColors

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: separate; margin: 24px 0 8px;">
    <tr>
      <td style="background-color: ${colors.primary}; border-radius: 999px;">
        <a href="${href}" style="display: inline-block; padding: 12px 20px; color: ${colors.primaryText}; font-size: 14px; font-weight: 700; text-decoration: none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`
}

export function renderMutedLink(href: string, label: string): string {
  return `<a href="${href}" style="color: ${portfolioEmailColors.muted}; text-decoration: underline;">${escapeHtml(label)}</a>`
}
