import type { SupabaseAuthClient, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { CommenterAuthenticator } from '@/lib/server/application/comments/comments'

type SupabaseAuthDataClient = SupabaseDataClient & { auth: SupabaseAuthClient }

export function createSupabaseCommenterAuthenticator(supabaseAdmin: SupabaseAuthDataClient): CommenterAuthenticator {
  return {
    async authenticate(token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token)
      const user = data?.user || null
      if (error || !user) return null
      return { type: 'user', id: user.id }
    }
  }
}
