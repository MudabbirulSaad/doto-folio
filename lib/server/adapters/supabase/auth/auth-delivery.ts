import type { SupabaseAuthClient, SupabaseDataClient } from '@/lib/server/adapters/supabase/types'
import { ApplicationError } from '@/lib/server/domain/errors'
import type { AuthDelivery } from '@/lib/server/application/auth/auth-flows'

type SupabaseAuthDataClient = SupabaseDataClient & { auth: SupabaseAuthClient }

interface SupabaseOtpOptions {
  shouldCreateUser: boolean
  data?: {
    full_name: string
  }
}

interface SupabaseVerifyOtpData {
  session: unknown
  user: unknown
}

export function createSupabaseAuthDelivery(supabase: SupabaseAuthDataClient): AuthDelivery {
  return {
    async sendOtp(email, options) {
      const otpOptions: SupabaseOtpOptions = { shouldCreateUser: true }
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
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' }) as {
        data: SupabaseVerifyOtpData | null
        error: { message: string } | null
      }
      if (error || !data) {
        throw new ApplicationError('UNAUTHORIZED', 'Invalid or expired code')
      }

      return {
        session: data.session,
        user: data.user
      }
    }
  }
}
