import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import { ApplicationError } from '@/lib/server/domain/errors'
import type {
  ContactContentRepository,
  ContactMethodContent,
  SocialLinkContent
} from '@/lib/server/application/content/contact-content'

function databaseError(message: string, error: { message?: string }): never {
  throw new ApplicationError('DATABASE_ERROR', message, error.message ? [error.message] : [message])
}

export function createSupabaseContactContentRepository(supabase: SupabaseDataClient): ContactContentRepository {
  return {
    async listContactMethods() {
      const { data, error } = await supabase
        .from('contact_methods')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true }) as {
          data: ContactMethodContent[] | null
          error: { message?: string } | null
        }
      if (error) databaseError('Failed to fetch contact methods', error)
      return data || []
    },

    async listSocialLinks() {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true }) as {
          data: SocialLinkContent[] | null
          error: { message?: string } | null
        }
      if (error) databaseError('Failed to fetch social links', error)
      return data || []
    },

    async getLastContactMethodDisplayOrder() {
      const { data } = await supabase
        .from('contact_methods')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single<{ display_order?: number | null }>()
      return data?.display_order || 0
    },

    async getLastSocialLinkDisplayOrder() {
      const { data } = await supabase
        .from('social_links')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single<{ display_order?: number | null }>()
      return data?.display_order || 0
    },

    async createContactMethod(data) {
      const { data: contactMethod, error } = await supabase
        .from('contact_methods')
        .insert(data)
        .select()
        .single<ContactMethodContent>()
      if (error) databaseError('Failed to create contact method', error)
      if (!contactMethod) databaseError('Failed to create contact method', { message: 'No contact method returned' })
      return contactMethod
    },

    async createSocialLink(data) {
      const { data: socialLink, error } = await supabase
        .from('social_links')
        .insert(data)
        .select()
        .single<SocialLinkContent>()
      if (error) databaseError('Failed to create social link', error)
      if (!socialLink) databaseError('Failed to create social link', { message: 'No social link returned' })
      return socialLink
    }
  }
}
