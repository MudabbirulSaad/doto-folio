import type { CurrentAdminUserPort } from '@/lib/server/application/auth/current-admin-user'

export function createSupabaseCurrentAdminUser(supabase: any): CurrentAdminUserPort {
  return {
    async getUser() {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error }
    }
  }
}
