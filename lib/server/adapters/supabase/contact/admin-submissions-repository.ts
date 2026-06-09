import type { SupabaseDataClient, SupabaseQuery } from '@/lib/server/adapters/supabase/types'
import { ApplicationError } from '@/lib/server/domain/errors'
import type {
  ContactSubmissionAdminRecord,
  ContactSubmissionAdminRepository,
  ContactSubmissionFilters
} from '@/lib/server/application/contact/admin-submissions'

function applySubmissionFilters(query: SupabaseQuery, filters: ContactSubmissionFilters & { now: Date }) {
  let filteredQuery = query

  if (filters.search) {
    filteredQuery = filteredQuery.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,message.ilike.%${filters.search}%`)
  }

  if (filters.readStatus === 'read') {
    filteredQuery = filteredQuery.eq('is_read', true)
  } else if (filters.readStatus === 'unread') {
    filteredQuery = filteredQuery.eq('is_read', false)
  }

  const now = filters.now
  if (filters.timeFilter === 'last7days') {
    filteredQuery = filteredQuery.gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
  } else if (filters.timeFilter === 'last30days') {
    filteredQuery = filteredQuery.gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
  } else if (filters.timeFilter === 'last3months') {
    filteredQuery = filteredQuery.gte('created_at', new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString())
  } else if (filters.timeFilter === 'lastyear') {
    filteredQuery = filteredQuery.gte('created_at', new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString())
  } else if (filters.timeFilter === 'custom' && filters.startDate && filters.endDate) {
    filteredQuery = filteredQuery.gte('created_at', filters.startDate).lte('created_at', filters.endDate)
  }

  return filteredQuery
}

export function createSupabaseContactSubmissionAdminRepository(supabase: SupabaseDataClient): ContactSubmissionAdminRepository {
  return {
    async listSubmissions(filters) {
      const query = applySubmissionFilters(
        supabase
          .from('contact_submissions')
          .select('*')
          .order('created_at', { ascending: false }),
        filters
      )

      const { data, error } = await query as {
        data: ContactSubmissionAdminRecord[] | null
        error: { message: string } | null
      }
      if (error) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to fetch submissions', [error.message])
      }

      return data || []
    },

    async updateReadStatus(submissionIds, data) {
      const { data: submissions, error } = await supabase
        .from('contact_submissions')
        .update(data)
        .in('id', submissionIds)
        .select() as {
          data: ContactSubmissionAdminRecord[] | null
          error: { message: string } | null
        }

      if (error) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to update submissions', [error.message])
      }

      return submissions || []
    }
  }
}
