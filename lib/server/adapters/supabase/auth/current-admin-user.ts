import type { SupabaseAuthClient, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { CurrentAdminUserPort } from '@/lib/server/application/auth/current-admin-user'

type SupabaseAuthDataClient = SupabaseDataClient & { auth: SupabaseAuthClient }

export function createSupabaseCurrentAdminUser(supabase: SupabaseAuthDataClient): CurrentAdminUserPort {
  return {
    async getUser() {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error }
    }
  }
}
