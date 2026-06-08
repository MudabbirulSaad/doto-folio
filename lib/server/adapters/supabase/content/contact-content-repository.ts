import { ApplicationError } from '@/lib/server/domain/errors'
import type { ContactContentRepository } from '@/lib/server/application/content/contact-content'

function databaseError(message: string, error: { message?: string }): never {
  throw new ApplicationError('DATABASE_ERROR', message, error.message ? [error.message] : [message])
}

export function createSupabaseContactContentRepository(supabase: any): ContactContentRepository {
  return {
    async listContactMethods() {
      const { data, error } = await supabase
        .from('contact_methods')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true })
      if (error) databaseError('Failed to fetch contact methods', error)
      return data || []
    },

    async listSocialLinks() {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true })
      if (error) databaseError('Failed to fetch social links', error)
      return data || []
    },

    async getLastContactMethodDisplayOrder() {
      const { data } = await supabase
        .from('contact_methods')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single()
      return data?.display_order || 0
    },

    async getLastSocialLinkDisplayOrder() {
      const { data } = await supabase
        .from('social_links')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single()
      return data?.display_order || 0
    },

    async createContactMethod(data) {
      const { data: contactMethod, error } = await supabase
        .from('contact_methods')
        .insert(data)
        .select()
        .single()
      if (error) databaseError('Failed to create contact method', error)
      return contactMethod
    },

    async createSocialLink(data) {
      const { data: socialLink, error } = await supabase
        .from('social_links')
        .insert(data)
        .select()
        .single()
      if (error) databaseError('Failed to create social link', error)
      return socialLink
    }
  }
}
