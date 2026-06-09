import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseAndValidateJSON } from '@/lib/api/validation'
import { rateLimit } from '@/lib/api/rate-limit'
import {
  createRateLimitResponse,
  createValidationErrorResponse,
  createSuccessResponse,
  createErrorResponse,
  createInternalErrorResponse,
  createMethodNotAllowedResponse
} from '@/lib/api/response'
import { createNewsletterSubscriptionUseCase } from '@/lib/server/composition/subscriptions'
import { isApplicationError } from '@/lib/server/domain/errors'

const NewsletterSubscriptionSchema = z.object({
  name: z.string().max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters')
})

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined

  try {
    const rateLimitResult = rateLimit(request, 'subscription')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult, { origin })
    }

    const validation = await parseAndValidateJSON(request, NewsletterSubscriptionSchema)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!, undefined, {
        origin,
        rateLimitResult
      })
    }

    const { name, email } = validation.data!

    const result = await createNewsletterSubscriptionUseCase()({ name, email })

    if (result.status === 'reactivated') {
      return createSuccessResponse({
        message: 'Successfully reactivated your subscription!'
      }, 'Successfully reactivated your subscription!')
    }

    return createSuccessResponse({
      message: 'Successfully subscribed to newsletter!',
      subscriber: {
        id: result.subscriber.id,
        email: result.subscriber.email,
        name: result.subscriber.name
      }
    }, 'Successfully subscribed to newsletter!')

  } catch (error) {
    if (isApplicationError(error)) {
      const status = error.code === 'FORBIDDEN' ? 409 : error.code === 'VALIDATION_ERROR' ? 400 : 500
      return createErrorResponse(error.code, error.message, status, error.details)
    }

    console.error('Subscription API error:', error)
    return createInternalErrorResponse('Internal server error')
  }
}

export async function GET() {
  return createMethodNotAllowedResponse()
}
