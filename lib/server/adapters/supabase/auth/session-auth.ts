import type { SessionAuthPort } from '@/lib/server/application/auth/logout'

export function createSupabaseSessionAuth(supabase: any): SessionAuthPort {
  return {
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  }
}
