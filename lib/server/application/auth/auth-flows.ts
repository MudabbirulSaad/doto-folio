import { ApplicationError } from '@/lib/server/domain/errors'

export interface HumanVerifier {
  verify(token: string, ipAddress: string): Promise<boolean>
}

export interface AuthDelivery {
  sendOtp(email: string, options: { name?: string }): Promise<void>
  sendMagicLink(email: string, options: { redirectTo: string }): Promise<void>
  verifyOtp(email: string, token: string): Promise<{ session: unknown; user: unknown }>
}

async function assertHuman(verifier: HumanVerifier, captchaToken: string, ipAddress: string, message = 'Bot detected') {
  const isHuman = await verifier.verify(captchaToken, ipAddress)
  if (!isHuman) {
    throw new ApplicationError('VALIDATION_ERROR', 'Validation failed', [message])
  }
}

export async function requestOtp(
  verifier: HumanVerifier,
  auth: AuthDelivery,
  input: { email: string; name?: string; captchaToken: string; ipAddress: string }
) {
  await assertHuman(verifier, input.captchaToken, input.ipAddress)
  await auth.sendOtp(input.email, { name: input.name })
  return { sent: true }
}

export async function requestMagicLink(
  verifier: HumanVerifier,
  auth: AuthDelivery,
  input: { email: string; captchaToken: string; ipAddress: string; redirectTo: string }
) {
  await assertHuman(verifier, input.captchaToken, input.ipAddress, 'Bot detected or low score')
  await auth.sendMagicLink(input.email, { redirectTo: input.redirectTo })
  return { sent: true }
}

export async function verifyOtp(
  verifier: HumanVerifier,
  auth: AuthDelivery,
  input: { email: string; token: string; captchaToken: string; ipAddress: string }
) {
  await assertHuman(verifier, input.captchaToken, input.ipAddress)
  return auth.verifyOtp(input.email, input.token)
}
