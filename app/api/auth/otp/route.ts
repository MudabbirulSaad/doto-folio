import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseAndValidateJSON } from '@/lib/api/validation'
import { rateLimit } from '@/lib/api/rate-limit'
import {
    createSuccessResponse,
    createValidationErrorResponse,
    createRateLimitResponse,
    createInternalErrorResponse,
    createUnauthorizedResponse,
    logApiRequest,
    logApiError
} from '@/lib/api/response'
import { createOtpUseCases } from '@/lib/server/composition/auth'
import { isApplicationError } from '@/lib/server/domain/errors'
import { createApplicationErrorResponse } from '@/lib/server/adapters/http/errors'

// Schema for Requesting OTP
const RequestOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.union([z.string().min(2, 'Name is too short'), z.literal('')]).optional(),
    captchaToken: z.string().min(1, 'reCAPTCHA token is required')
})

// Schema for Verifying OTP
const VerifyOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
    token: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits'),
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
            logApiRequest('POST', '/api/auth/otp', 429, Date.now() - startTime)
            return createRateLimitResponse(rateLimitResult, { origin })
        }

        // 2. Validation
        const validation = await parseAndValidateJSON(request, RequestOtpSchema)
        if (!validation.success) {
            logApiRequest('POST', '/api/auth/otp', 400, Date.now() - startTime)
            return createValidationErrorResponse(validation.errors!, undefined, { origin })
        }

        const { email, name, captchaToken } = validation.data!

        await createOtpUseCases().request({ email, name, captchaToken, ipAddress: ip })

        logApiRequest('POST', '/api/auth/otp', 200, Date.now() - startTime)
        return createSuccessResponse(
            { sent: true },
            'Verification code sent',
            undefined,
            { origin }
        )

    } catch (error) {
        if (isApplicationError(error)) {
            return createApplicationErrorResponse(error)
        }

        logApiError(error as Error, { method: 'POST', path: '/api/auth/otp' })
        return createInternalErrorResponse('Failed to send code', undefined, { origin })
    }
}

export async function PUT(request: NextRequest) {
    const startTime = Date.now()
    const origin = request.headers.get('origin') || undefined
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    try {
        // 1. Rate Limiting
        const rateLimitResult = rateLimit(request, 'auth')
        if (!rateLimitResult.success) {
            logApiRequest('PUT', '/api/auth/otp', 429, Date.now() - startTime)
            return createRateLimitResponse(rateLimitResult, { origin })
        }

        // 2. Validation
        const validation = await parseAndValidateJSON(request, VerifyOtpSchema)
        if (!validation.success) {
            logApiRequest('PUT', '/api/auth/otp', 400, Date.now() - startTime)
            return createValidationErrorResponse(validation.errors!, undefined, { origin })
        }

        const { email, token, captchaToken } = validation.data!

        const data = await createOtpUseCases().verify({ email, token, captchaToken, ipAddress: ip })

        logApiRequest('PUT', '/api/auth/otp', 200, Date.now() - startTime)
        return createSuccessResponse(
            { session: data.session, user: data.user },
            'Successfully verified',
            undefined,
            { origin }
        )

    } catch (error) {
        if (isApplicationError(error)) {
            if (error.code === 'UNAUTHORIZED') {
                return createUnauthorizedResponse(error.message, { origin })
            }
            return createApplicationErrorResponse(error)
        }

        logApiError(error as Error, { method: 'PUT', path: '/api/auth/otp' })
        return createInternalErrorResponse('Failed to verify code', undefined, { origin })
    }
}
