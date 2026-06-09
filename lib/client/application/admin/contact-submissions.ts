import type {
  AdminContactSubmission,
  AdminContactSubmissionExportFormat,
  AdminContactSubmissionFilters
} from '@/lib/client/domain/contact-submissions'

export interface AdminContactSubmissionExportPayload {
  blob: Blob
  filename: string
}

export interface AdminContactSubmissionGateway {
  list(filters: AdminContactSubmissionFilters): Promise<AdminContactSubmission[]>
  updateReadStatus(submissionIds: string[], isRead: boolean, readBy: string): Promise<{
    updated: number
    submissions: Array<{ id: string }>
  }>
  export(
    format: AdminContactSubmissionExportFormat,
    filters: AdminContactSubmissionFilters
  ): Promise<AdminContactSubmissionExportPayload>
}

function workflowError(error: unknown, fallback: string) {
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback
  }
}

export async function loadAdminContactSubmissions(
  gateway: AdminContactSubmissionGateway,
  filters: AdminContactSubmissionFilters
) {
  try {
    return {
      success: true as const,
      submissions: await gateway.list(filters)
    }
  } catch (error) {
    return workflowError(error, 'Failed to load submissions')
  }
}

export async function updateAdminContactSubmissionReadStatus(
  gateway: AdminContactSubmissionGateway,
  submissionIds: string[],
  isRead: boolean,
  readBy = 'Admin'
) {
  try {
    const result = await gateway.updateReadStatus(submissionIds, isRead, readBy)
    return {
      success: true as const,
      updated: result.updated,
      submissionIds,
      isRead
    }
  } catch (error) {
    return workflowError(error, 'Failed to update read status')
  }
}

export async function exportAdminContactSubmissions(
  gateway: AdminContactSubmissionGateway,
  format: AdminContactSubmissionExportFormat,
  filters: AdminContactSubmissionFilters
) {
  try {
    return {
      success: true as const,
      ...await gateway.export(format, filters)
    }
  } catch (error) {
    return workflowError(error, 'Failed to export submissions')
  }
}
