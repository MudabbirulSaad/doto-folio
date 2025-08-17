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

// =============================================
// VALIDATION SCHEMA
// =============================================

const RecaptchaVerificationSchema = z.object({
  token: z.string()
    .min(1, 'reCAPTCHA token is required')
    .max(2000, 'Invalid reCAPTCHA token format')
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

    const verificationResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip
      }).toString(),
    })

    if (!verificationResponse.ok) {
      logApiError(new Error(`reCAPTCHA API error: ${verificationResponse.status}`), {
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

    const verificationResult = await verificationResponse.json()

    // Check verification result
    if (!verificationResult.success) {
      const errorCodes = verificationResult['error-codes'] || []
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
    const minScore = 0.5 // Minimum acceptable score
    
    if (score !== undefined && score < minScore) {
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
        score: score || null,
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
