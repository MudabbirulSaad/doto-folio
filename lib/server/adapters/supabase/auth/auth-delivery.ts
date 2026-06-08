import { ApplicationError } from '@/lib/server/domain/errors'
import type { AuthDelivery } from '@/lib/server/application/auth/auth-flows'

export function createSupabaseAuthDelivery(supabase: any): AuthDelivery {
  return {
    async sendOtp(email, options) {
      const otpOptions: any = { shouldCreateUser: true }
      if (options.name) {
        otpOptions.data = { full_name: options.name }
      }

      const { error } = await supabase.auth.signInWithOtp({ email, options: otpOptions })
      if (error) throw error
    },

    async sendMagicLink(email, options) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: options.redirectTo,
          shouldCreateUser: true
        }
      })

      if (error) throw error
    },

    async verifyOtp(email, token) {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
      if (error) {
        throw new ApplicationError('UNAUTHORIZED', 'Invalid or expired code')
      }

      return {
        session: data.session,
        user: data.user
      }
    }
  }
}
