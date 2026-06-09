import type { SupabaseAuthClient, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import type { CurrentAdminUserPort } from '@/lib/server/application/auth/current-admin-user'

type SupabaseAuthDataClient = SupabaseDataClient & { auth: SupabaseAuthClient }

export function createSupabaseCurrentAdminUser(supabase: SupabaseAuthDataClient): CurrentAdminUserPort {
  return {
    async getUser() {
      const { data, error } = await supabase.auth.getUser()
      return { user: data?.user || null, error }
    }
  }
}
