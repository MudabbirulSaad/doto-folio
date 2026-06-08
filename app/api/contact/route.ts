import { NextRequest } from 'next/server'
import { ContactFormSchema, parseAndValidateJSON } from '@/lib/api/validation'
import { rateLimit } from '@/lib/api/rate-limit'
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createRateLimitResponse,
  createInternalErrorResponse,
  createOptionsResponse,
  logApiRequest,
  logApiError
} from '@/lib/api/response'
import type { ContactFormData } from '@/lib/services/contact'
import { createContactSubmissionUseCase } from '@/lib/server/composition/contact'
import { isApplicationError } from '@/lib/server/domain/errors'
import { createApplicationErrorResponse } from '@/lib/server/adapters/http/errors'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const origin = request.headers.get('origin') || undefined

  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request, 'contact')
    if (!rateLimitResult.success) {
      logApiRequest('POST', '/api/contact', 429, Date.now() - startTime)
      return createRateLimitResponse(rateLimitResult, { origin })
    }

    // Validate and parse request
    const validation = await parseAndValidateJSON(request, ContactFormSchema)
    if (!validation.success) {
      logApiRequest('POST', '/api/contact', 400, Date.now() - startTime)
      return createValidationErrorResponse(validation.errors!, undefined, {
        origin,
        rateLimitResult
      })
    }

    const { name, email, subject, message } = validation.data!

    // Prepare form data
    const formData: ContactFormData = {
      name,
      email: email.toLowerCase(),
      subject,
      message,
    }

    const submitContact = createContactSubmissionUseCase()
    const { submission, emailStatus } = await submitContact(formData)

    logApiRequest('POST', '/api/contact', 200, Date.now() - startTime)

    return createSuccessResponse(
      submission,
      "Your message has been sent successfully! I'll get back to you soon.",
      undefined,
      {
        origin,
        rateLimitResult,
        headers: process.env.NODE_ENV === 'development' ? { 'X-Email-Status': emailStatus } : undefined
      }
    )

  } catch (error) {
    if (isApplicationError(error)) {
      logApiError(error, {
        method: 'POST',
        path: '/api/contact'
      })
      logApiRequest('POST', '/api/contact', 500, Date.now() - startTime)
      return createApplicationErrorResponse(error)
    }

    logApiError(error as Error, {
      method: 'POST',
      path: '/api/contact'
    })
    logApiRequest('POST', '/api/contact', 500, Date.now() - startTime)

    return createInternalErrorResponse(
      'An unexpected error occurred. Please try again later.',
      undefined,
      { origin }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined
  return createOptionsResponse({ origin })
}
