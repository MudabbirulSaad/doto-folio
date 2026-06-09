import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import { ApplicationError } from '@/lib/server/domain/errors'
import {
  PUBLIC_SITE_CONTENT_SELECT,
  type SiteContentRepository
} from '@/lib/server/application/content/site-content'

function databaseError(message: string, error: { message?: string }): never {
  throw new ApplicationError('DATABASE_ERROR', message, error.message ? [error.message] : [message])
}

export function createSupabaseSiteContentRepository(supabase: SupabaseDataClient): SiteContentRepository {
  return {
    async getPublishedSiteContent() {
      const { data, error } = await supabase
        .from('site_content')
        .select(PUBLIC_SITE_CONTENT_SELECT)
        .eq('is_published', true)
        .single<Record<string, unknown>>()

      if (error?.code === 'PGRST116') return null
      if (error) databaseError('Failed to fetch site content', error)
      return data
    },

    async getSiteContent() {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .single<Record<string, unknown>>()
      if (error) databaseError('Failed to fetch site content', error)
      return data
    },

    async hasSiteContent() {
      const { data } = await supabase
        .from('site_content')
        .select('id')
        .single<{ id: string }>()
      return Boolean(data)
    },

    async updateSiteContent(data) {
      const { data: content, error } = await supabase
        .from('site_content')
        .update(data)
        .select()
        .single<Record<string, unknown>>()
      if (error) databaseError('Failed to update site content', error)
      if (!content) databaseError('Failed to update site content', { message: 'No site content returned' })
      return content
    },

    async insertSiteContent(data) {
      const { data: content, error } = await supabase
        .from('site_content')
        .insert(data)
        .select()
        .single<Record<string, unknown>>()
      if (error) databaseError('Failed to update site content', error)
      if (!content) databaseError('Failed to update site content', { message: 'No site content returned' })
      return content
    }
  }
}
