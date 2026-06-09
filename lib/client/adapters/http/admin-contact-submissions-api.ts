import type { AdminContactSubmissionGateway } from '@/lib/client/application/admin/contact-submissions'
import type {
  AdminContactSubmission,
  AdminContactSubmissionExportFormat,
  AdminContactSubmissionFilters
} from '@/lib/client/domain/contact-submissions'

interface SubmissionsResponse {
  submissions: AdminContactSubmission[]
}

interface UpdateReadStatusResponse {
  updated: number
  submissions: Array<{ id: string }>
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : 'Request failed'
    throw new Error(message)
  }

  return payload as T
}

function buildSubmissionParams(filters: AdminContactSubmissionFilters) {
  return new URLSearchParams({
    search: filters.search,
    readStatus: filters.readStatus,
    timeFilter: filters.timeFilter
  })
}

function filenameFromDisposition(header: string | null, fallback: string) {
  const match = header?.match(/filename="?([^"]+)"?/i)
  return match?.[1] || fallback
}

export function createAdminContactSubmissionApiGateway(
  fetcher: typeof fetch = fetch,
  now: () => Date = () => new Date()
): AdminContactSubmissionGateway {
  return {
    async list(filters) {
      const response = await fetcher(`/api/admin/submissions?${buildSubmissionParams(filters)}`)
      return (await readJson<SubmissionsResponse>(response)).submissions
    },
    async updateReadStatus(submissionIds, isRead, readBy) {
      const response = await fetcher('/api/admin/submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionIds,
          isRead,
          readBy
        })
      })
      return readJson<UpdateReadStatusResponse>(response)
    },
    async export(format: AdminContactSubmissionExportFormat, filters) {
      const params = buildSubmissionParams(filters)
      params.set('format', format)
      const response = await fetcher(`/api/admin/submissions/export?${params}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      return {
        blob: await response.blob(),
        filename: filenameFromDisposition(
          response.headers.get('Content-Disposition'),
          `contact-submissions-${now().toISOString().split('T')[0]}.${format}`
        )
      }
    }
  }
}
