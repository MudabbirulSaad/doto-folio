import type { HumanVerifier } from '@/lib/server/application/auth/auth-flows'

export interface RecaptchaVerificationResult {
  verified: boolean
  score: number | null
  errors: string[]
}

export function createRecaptchaVerificationAdapter(secretKey: string) {
  return {
    async verify(token: string, ipAddress: string): Promise<RecaptchaVerificationResult> {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
          remoteip: ipAddress
        }).toString()
      })

      if (!response.ok) throw new Error('Failed to verify reCAPTCHA')

      const data = await response.json()
      const score = typeof data.score === 'number' ? data.score : null
      const errors = data['error-codes'] || []

      return {
        verified: Boolean(data.success) && (score === null || score >= 0.5),
        score,
        errors
      }
    }
  }
}

export function createRecaptchaHumanVerifier(secretKey: string): HumanVerifier {
  const verifier = createRecaptchaVerificationAdapter(secretKey)

  return {
    async verify(token, ipAddress) {
      return (await verifier.verify(token, ipAddress)).verified
    }
  }
}
