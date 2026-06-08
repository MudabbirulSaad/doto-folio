import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { requestMagicLink, requestOtp, verifyOtp } from '@/lib/server/application/auth/auth-flows'
import { signOutCurrentSession } from '@/lib/server/application/auth/logout'
import { createRecaptchaHumanVerifier } from '@/lib/server/adapters/http/recaptcha-human-verifier'
import { createSupabaseAuthDelivery } from '@/lib/server/adapters/supabase/auth/auth-delivery'
import { createSupabaseSessionAuth } from '@/lib/server/adapters/supabase/auth/session-auth'

function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function createAuthDependencies() {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  if (!secretKey) throw new Error('RECAPTCHA_SECRET_KEY is not defined')

  return {
    verifier: createRecaptchaHumanVerifier(secretKey),
    auth: createSupabaseAuthDelivery(createSupabaseAdminClient())
  }
}

export function createOtpUseCases() {
  const { verifier, auth } = createAuthDependencies()
  return {
    request: (input: { email: string; name?: string; captchaToken: string; ipAddress: string }) =>
      requestOtp(verifier, auth, input),
    verify: (input: { email: string; token: string; captchaToken: string; ipAddress: string }) =>
      verifyOtp(verifier, auth, input)
  }
}

export function createMagicLinkUseCase() {
  const { verifier, auth } = createAuthDependencies()
  return (input: { email: string; captchaToken: string; ipAddress: string; redirectTo: string }) =>
    requestMagicLink(verifier, auth, input)
}

export async function createLogoutUseCase() {
  const auth = createSupabaseSessionAuth(await createServerClient())
  return () => signOutCurrentSession(auth)
}
