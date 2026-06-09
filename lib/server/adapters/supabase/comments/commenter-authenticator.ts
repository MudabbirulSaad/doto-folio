import type { SupabaseAuthClient, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { CommenterAuthenticator } from '@/lib/server/application/comments/comments'

type SupabaseAuthDataClient = SupabaseDataClient & { auth: SupabaseAuthClient }

export function createSupabaseCommenterAuthenticator(supabaseAdmin: SupabaseAuthDataClient): CommenterAuthenticator {
  return {
    async authenticate(token) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) return null
      return { id: user.id }
    }
  }
}
