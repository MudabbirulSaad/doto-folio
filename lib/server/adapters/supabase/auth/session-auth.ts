import type { SupabaseAuthClient, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { SessionAuthPort } from '@/lib/server/application/auth/logout'

type SupabaseAuthDataClient = SupabaseDataClient & { auth: SupabaseAuthClient }

export function createSupabaseSessionAuth(supabase: SupabaseAuthDataClient): SessionAuthPort {
  return {
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  }
}
