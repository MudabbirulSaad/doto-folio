import { ApplicationError } from '@/lib/server/domain/errors'

export interface ContactSubmissionFilters {
  search?: string
  readStatus?: string
  timeFilter?: string
  startDate?: string | null
  endDate?: string | null
}

export interface ContactSubmissionAdminRepository {
  listSubmissions(filters: ContactSubmissionFilters & { now: Date }): Promise<any[]>
  updateReadStatus(submissionIds: string[], data: {
    is_read: boolean
    updated_at: string
    read_at?: string | null
    read_by?: string | null
  }): Promise<any[]>
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
  const updateData: {
    is_read: boolean
    updated_at: string
    read_at?: string | null
    read_by?: string | null
  } = {
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
