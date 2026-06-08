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
import { createMagicLinkUseCase } from '@/lib/server/composition/auth'
import { isApplicationError } from '@/lib/server/domain/errors'
import { createApplicationErrorResponse } from '@/lib/server/adapters/http/errors'

// Schema for Magic Link Request
const MagicLinkSchema = z.object({
    email: z.string().email('Invalid email address'),
    captchaToken: z.string().min(1, 'reCAPTCHA token is required')
})

export async function POST(request: NextRequest) {
    const startTime = Date.now()
    const origin = request.headers.get('origin') || undefined
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    try {
        // 1. Rate Limiting
        const rateLimitResult = rateLimit(request, 'auth')
        if (!rateLimitResult.success) {
            logApiRequest('POST', '/api/auth/magic-link', 429, Date.now() - startTime)
            return createRateLimitResponse(rateLimitResult, { origin })
        }

        // 2. Validation
        const validation = await parseAndValidateJSON(request, MagicLinkSchema)
        if (!validation.success) {
            logApiRequest('POST', '/api/auth/magic-link', 400, Date.now() - startTime)
            return createValidationErrorResponse(validation.errors!, undefined, { origin })
        }

        const { email, captchaToken } = validation.data!

        await createMagicLinkUseCase()({
            email,
            captchaToken,
            ipAddress: ip,
            redirectTo: `${origin}/auth/confirm?next=/blog`
        })

        logApiRequest('POST', '/api/auth/magic-link', 200, Date.now() - startTime)
        return createSuccessResponse(
            { sent: true },
            'Magic link sent successfully',
            undefined,
            { origin }
        )

    } catch (error) {
        if (isApplicationError(error)) {
            return createApplicationErrorResponse(error)
        }

        logApiError(error as Error, { method: 'POST', path: '/api/auth/magic-link' })
        return createInternalErrorResponse(
            'Failed to send magic link',
            undefined,
            { origin }
        )
    }
}
