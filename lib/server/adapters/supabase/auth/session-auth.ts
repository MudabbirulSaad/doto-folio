import type { SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { SessionAuthPort } from '@/lib/server/application/auth/logout'

export function createSupabaseSessionAuth(supabase: SupabaseDataClient): SessionAuthPort {
  return {
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  }
}
