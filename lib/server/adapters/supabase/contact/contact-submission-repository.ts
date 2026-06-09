import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import { ApplicationError } from '@/lib/server/domain/errors'
import type { ContactSubmissionRepository } from '@/lib/server/application/contact/contact-submission'
import type { ContactSubmissionInsert } from '@/lib/types/database'

export function createSupabaseContactSubmissionRepository(supabase: SupabaseDataClient): ContactSubmissionRepository {
  return {
    async saveSubmission(formData) {
      const submissionData: ContactSubmissionInsert = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      }

      const { data, error } = await supabase
        .from('contact_submissions')
        .insert(submissionData)
        .select()
        .single<Record<string, unknown>>()

      if (error) {
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to submit your message. Please try again later.',
          [error.message]
        )
      }

      return data || {}
    }
  }
}
