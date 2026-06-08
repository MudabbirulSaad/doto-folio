import type { CommenterAuthenticator } from '@/lib/server/application/comments/comments'

export function createSupabaseCommenterAuthenticator(supabaseAdmin: any): CommenterAuthenticator {
  return {
    async authenticate(token) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) return null
      return { id: user.id }
    }
  }
}
