export interface AdminContactSubmission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  read_at: string | null
  read_by: string | null
  created_at: string
  updated_at: string
}

export interface AdminContactSubmissionFilters {
  search: string
  readStatus: string
  timeFilter: string
}

export type AdminContactSubmissionExportFormat = 'csv' | 'json' | 'html'
