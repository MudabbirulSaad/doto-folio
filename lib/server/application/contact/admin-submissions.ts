import { ApplicationError } from '@/lib/server/domain/errors'

export interface ContactSubmissionFilters {
  search?: string
  readStatus?: string
  timeFilter?: string
  startDate?: string | null
  endDate?: string | null
}

export interface ContactSubmissionAdminRecord {
  id: string
  name: string
  email: string
  subject: string
  message: string
  created_at: string
  updated_at: string
  is_read: boolean
  read_at: string | null
  read_by: string | null
  [key: string]: unknown
}

export interface ContactSubmissionReadStatusUpdate {
  is_read: boolean
  updated_at: string
  read_at?: string | null
  read_by?: string | null
}

export interface ContactSubmissionAdminRepository {
  listSubmissions(filters: ContactSubmissionFilters & { now: Date }): Promise<ContactSubmissionAdminRecord[]>
  updateReadStatus(
    submissionIds: string[],
    data: ContactSubmissionReadStatusUpdate
  ): Promise<ContactSubmissionAdminRecord[]>
}

export interface ContactSubmissionExportRecord {
  id: string
  name: string
  email: string
  subject: string
  message: string
  created_at: string
  updated_at: string
  is_read: boolean
  read_at: string | null
  read_by: string | null
}

export type ContactSubmissionExportFormat = 'csv' | 'json' | 'html'

export interface ContactSubmissionExport {
  body: string
  contentType: string
  filename: string
}

export function listContactSubmissions(
  repository: ContactSubmissionAdminRepository,
  filters: ContactSubmissionFilters,
  options: { now?: () => Date } = {}
) {
  return repository.listSubmissions({
    ...filters,
    now: (options.now || (() => new Date()))()
  })
}

export async function updateContactSubmissionReadStatus(
  repository: ContactSubmissionAdminRepository,
  input: { submissionIds?: unknown; isRead: boolean; readBy?: string | null },
  options: { now?: () => Date } = {}
) {
  if (!Array.isArray(input.submissionIds)) {
    throw new ApplicationError('VALIDATION_ERROR', 'Invalid submission IDs')
  }

  const now = (options.now || (() => new Date()))().toISOString()
  const updateData: ContactSubmissionReadStatusUpdate = {
    is_read: input.isRead,
    updated_at: now
  }

  if (input.isRead) {
    updateData.read_at = now
    updateData.read_by = input.readBy || null
  } else {
    updateData.read_at = null
    updateData.read_by = null
  }

  const submissions = await repository.updateReadStatus(input.submissionIds, updateData)

  return {
    success: true,
    updated: submissions.length,
    submissions
  }
}

export function exportContactSubmissions(
  submissions: ContactSubmissionExportRecord[],
  format: string,
  options: { now?: () => Date } = {}
): ContactSubmissionExport {
  if (!isExportFormat(format)) {
    throw new ApplicationError('VALIDATION_ERROR', 'Invalid export format')
  }

  const timestamp = (options.now || (() => new Date()))().toISOString().split('T')[0]

  if (format === 'csv') {
    return {
      body: generateCSV(submissions),
      contentType: 'text/csv',
      filename: `contact-submissions-${timestamp}.csv`
    }
  }

  if (format === 'json') {
    return {
      body: JSON.stringify(submissions, null, 2),
      contentType: 'application/json',
      filename: `contact-submissions-${timestamp}.json`
    }
  }

  return {
    body: generateHTML(submissions, options.now || (() => new Date())),
    contentType: 'text/html',
    filename: `contact-submissions-${timestamp}.html`
  }
}

function isExportFormat(format: string): format is ContactSubmissionExportFormat {
  return format === 'csv' || format === 'json' || format === 'html'
}

function generateCSV(submissions: ContactSubmissionExportRecord[]): string {
  const headers = [
    'ID',
    'Name',
    'Email',
    'Subject',
    'Message',
    'Read Status',
    'Read At',
    'Read By',
    'Submitted At',
    'Updated At'
  ]

  const csvRows = [headers.join(',')]

  submissions.forEach(submission => {
    const row = [
      `"${submission.id}"`,
      `"${submission.name.replace(/"/g, '""')}"`,
      `"${submission.email}"`,
      `"${submission.subject.replace(/"/g, '""')}"`,
      `"${submission.message.replace(/"/g, '""')}"`,
      `"${submission.is_read ? 'Read' : 'Unread'}"`,
      `"${submission.read_at || ''}"`,
      `"${submission.read_by || ''}"`,
      `"${submission.created_at}"`,
      `"${submission.updated_at}"`
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function generateHTML(submissions: ContactSubmissionExportRecord[], now: () => Date): string {
  const submissionsHTML = submissions.map(submission => `
    <div class="submission-card">
      <div class="card-header">
        <div class="status-indicator ${submission.is_read ? 'read' : 'unread'}"></div>
        <div class="header-content">
          <div class="name-email">
            <h3 class="name">${escapeHtml(submission.name)}</h3>
            <p class="email">${escapeHtml(submission.email)}</p>
          </div>
          <div class="meta-info">
            <p class="status">Status: ${submission.is_read ? 'Read' : 'Unread'}</p>
            <p class="date">Submitted: ${new Date(submission.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div class="card-content">
        <div class="subject-section">
          <h4>Subject:</h4>
          <p class="subject">${escapeHtml(submission.subject)}</p>
        </div>

        <div class="message-section">
          <h4>Message:</h4>
          <div class="message">${escapeHtml(submission.message).replace(/\n/g, '<br>')}</div>
        </div>

        ${submission.is_read && submission.read_at ? `
          <div class="read-info">
            Read on ${new Date(submission.read_at).toLocaleString()}${submission.read_by ? ` by ${escapeHtml(submission.read_by)}` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Submissions Report - SAAD Portfolio</title>
  <style>
    :root {
      --background: oklch(0.1776 0 0);
      --foreground: oklch(0.9491 0 0);
      --card: oklch(0.2134 0 0);
      --card-foreground: oklch(0.9491 0 0);
      --primary: oklch(0.9247 0.0524 66.1732);
      --primary-foreground: oklch(0.2029 0.0240 200.1962);
      --secondary: oklch(0.3163 0.0190 63.6992);
      --secondary-foreground: oklch(0.9247 0.0524 66.1732);
      --muted: oklch(0.2520 0 0);
      --muted-foreground: oklch(0.7699 0 0);
      --border: oklch(0.2351 0.0115 91.7467);
      --destructive: oklch(0.6271 0.1936 33.3390);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      background: var(--background);
      color: var(--foreground);
      line-height: 1.6;
      padding: 0;
      margin: 0;
      min-height: 100vh;
    }

    .header {
      background: var(--card);
      border-top: 3px solid var(--primary);
      padding: 24px;
      margin-bottom: 24px;
    }

    .header h1 {
      font-size: 28px;
      font-weight: bold;
      color: var(--foreground);
      margin-bottom: 8px;
    }

    .header .subtitle {
      font-size: 16px;
      color: var(--primary);
    }

    .report-meta {
      background: var(--background);
      padding: 20px 24px;
      margin-bottom: 24px;
    }

    .report-meta h2 {
      font-size: 20px;
      color: var(--foreground);
      margin-bottom: 12px;
    }

    .report-meta .meta-info {
      display: flex;
      gap: 48px;
      font-size: 14px;
      color: var(--muted-foreground);
    }

    .submissions-container {
      padding: 0 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .submission-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      padding: 20px;
      gap: 16px;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }

    .status-indicator.read {
      background: #22c55e;
    }

    .status-indicator.unread {
      background: #f97316;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 24px;
    }

    .name-email {
      flex: 1;
      min-width: 0;
    }

    .name {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 6px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .email {
      font-size: 14px;
      color: var(--primary);
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .meta-info {
      text-align: right;
      flex-shrink: 0;
    }

    .meta-info p {
      font-size: 12px;
      color: var(--muted-foreground);
      margin-bottom: 4px;
    }

    .card-content {
      padding: 0 20px 20px 20px;
    }

    .subject-section,
    .message-section {
      margin-bottom: 16px;
    }

    .subject-section h4,
    .message-section h4 {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 6px;
    }

    .subject {
      font-size: 13px;
      color: var(--foreground);
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
    }

    .message {
      font-size: 13px;
      color: var(--muted-foreground);
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      line-height: 1.6;
    }

    .read-info {
      font-size: 11px;
      color: #22c55e;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .footer {
      background: var(--card);
      padding: 16px 24px;
      margin-top: 48px;
      font-size: 12px;
      color: var(--muted-foreground);
      display: flex;
      justify-content: space-between;
      border-top: 1px solid var(--border);
    }

    .footer .brand {
      color: var(--primary);
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .submission-card {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SAAD Portfolio</h1>
    <div class="subtitle">Contact Submissions Report</div>
  </div>

  <div class="report-meta">
    <h2>Contact Submissions Report</h2>
    <div class="meta-info">
      <span>Generated: ${now().toLocaleString()}</span>
      <span>Total Submissions: ${submissions.length}</span>
    </div>
  </div>

  <div class="submissions-container">
    ${submissionsHTML}
  </div>

  <div class="footer">
    <span>Generated by SAAD Portfolio Admin System</span>
    <span class="brand">HTML Export</span>
  </div>
</body>
</html>`
}
