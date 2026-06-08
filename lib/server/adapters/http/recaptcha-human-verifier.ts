import type { HumanVerifier } from '@/lib/server/application/auth/auth-flows'

export function createRecaptchaHumanVerifier(secretKey: string): HumanVerifier {
  return {
    async verify(token, ipAddress) {
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
      return data.success && (!data.score || data.score >= 0.5)
    }
  }
}
