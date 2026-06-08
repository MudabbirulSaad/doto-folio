import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseAndValidateJSON } from '@/lib/api/validation'
import { rateLimit } from '@/lib/api/rate-limit'
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createRateLimitResponse,
  createInternalErrorResponse,
  logApiRequest,
  logApiError
} from '@/lib/api/response'
import { createRecaptchaVerificationAdapter } from '@/lib/server/adapters/http/recaptcha-human-verifier'

// =============================================
// VALIDATION SCHEMA
// =============================================

const RecaptchaVerificationSchema = z.object({
  token: z.string()
    .min(1, 'reCAPTCHA token is required')
    .max(8192, 'Invalid reCAPTCHA token format')
})

// =============================================
// RECAPTCHA VERIFICATION ENDPOINT
// =============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const origin = request.headers.get('origin') || undefined
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'

  try {
    // Rate limiting for reCAPTCHA verification
    const rateLimitResult = rateLimit(request, 'admin')
    if (!rateLimitResult.success) {
      logApiRequest('POST', '/api/admin/auth/verify-recaptcha', 429, Date.now() - startTime)
      return createRateLimitResponse(rateLimitResult, { origin })
    }

    // Validate request
    const validation = await parseAndValidateJSON(request, RecaptchaVerificationSchema)
    if (!validation.success) {
      logApiRequest('POST', '/api/admin/auth/verify-recaptcha', 400, Date.now() - startTime)
      return createValidationErrorResponse(validation.errors!, undefined, { 
        origin, 
        rateLimitResult 
      })
    }

    const { token } = validation.data!

    // Verify reCAPTCHA with Google
    const secretKey = process.env.RECAPTCHA_SECRET_KEY
    if (!secretKey) {
      logApiError(new Error('reCAPTCHA secret key not configured'), {
        method: 'POST',
        path: '/api/admin/auth/verify-recaptcha'
      })
      logApiRequest('POST', '/api/admin/auth/verify-recaptcha', 500, Date.now() - startTime)
      return createInternalErrorResponse(
        'reCAPTCHA verification service not configured',
        undefined,
        { origin, rateLimitResult }
      )
    }

    let verificationResult
    try {
      verificationResult = await createRecaptchaVerificationAdapter(secretKey).verify(token, ip)
    } catch (error) {
      logApiError(error as Error, {
        method: 'POST',
        path: '/api/admin/auth/verify-recaptcha'
      })
      logApiRequest('POST', '/api/admin/auth/verify-recaptcha', 500, Date.now() - startTime)
      return createInternalErrorResponse(
        'reCAPTCHA verification service unavailable',
        undefined,
        { origin, rateLimitResult }
      )
    }

    // Check verification result
    if (!verificationResult.verified && verificationResult.score === null) {
      const errorCodes = verificationResult.errors
      logApiRequest('POST', '/api/admin/auth/verify-recaptcha', 400, Date.now() - startTime)
      
      return createValidationErrorResponse(
        ['reCAPTCHA verification failed'],
        'recaptcha',
        { 
          origin, 
          rateLimitResult,
          headers: {
            'X-Recaptcha-Errors': errorCodes.join(',')
          }
        }
      )
    }

    // Check score for v3 reCAPTCHA (if available)
    const score = verificationResult.score
    
    if (!verificationResult.verified && score !== null) {
      logApiRequest('POST', '/api/admin/auth/verify-recaptcha', 400, Date.now() - startTime)
      return createValidationErrorResponse(
        ['reCAPTCHA score too low - suspicious activity detected'],
        'recaptcha',
        { 
          origin, 
          rateLimitResult,
          headers: {
            'X-Recaptcha-Score': score.toString()
          }
        }
      )
    }

    logApiRequest('POST', '/api/admin/auth/verify-recaptcha', 200, Date.now() - startTime)

    return createSuccessResponse(
      {
        verified: true,
        score,
        timestamp: new Date().toISOString()
      },
      'reCAPTCHA verification successful',
      undefined,
      { 
        origin, 
        rateLimitResult,
        headers: score ? { 'X-Recaptcha-Score': score.toString() } : undefined
      }
    )

  } catch (error) {
    logApiError(error as Error, {
      method: 'POST',
      path: '/api/admin/auth/verify-recaptcha'
    })
    logApiRequest('POST', '/api/admin/auth/verify-recaptcha', 500, Date.now() - startTime)
    
    return createInternalErrorResponse(
      'reCAPTCHA verification failed',
      undefined,
      { origin }
    )
  }
}
