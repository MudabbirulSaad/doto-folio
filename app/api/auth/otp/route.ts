import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { parseAndValidateJSON } from '@/lib/api/validation'
import { rateLimit } from '@/lib/api/rate-limit'
import {
    createSuccessResponse,
    createValidationErrorResponse,
    createRateLimitResponse,
    createInternalErrorResponse,
    createUnauthorizedResponse,
    createErrorResponse,
    logApiRequest,
    logApiError
} from '@/lib/api/response'

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

// Helper to verify ReCAPTCHA
async function verifyRecaptcha(token: string, ip: string) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY
    if (!secretKey) throw new Error('RECAPTCHA_SECRET_KEY is not defined')

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            secret: secretKey,
            response: token,
            remoteip: ip
        }).toString(),
    })

    if (!res.ok) throw new Error('Failed to verify reCAPTCHA')

    const data = await res.json()
    return data.success && (!data.score || data.score >= 0.5)
}

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

        // 3. Verify ReCAPTCHA
        const isHuman = await verifyRecaptcha(captchaToken, ip)
        if (!isHuman) {
            logApiRequest('POST', '/api/auth/otp', 400, Date.now() - startTime)
            return createValidationErrorResponse(['Bot detected'], 'captcha', { origin })
        }

        // 4. Send OTP via Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Store name in user metadata if provided
        const options: any = { shouldCreateUser: true }
        if (name) {
            options.data = { full_name: name }
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options
        })

        if (error) throw error

        logApiRequest('POST', '/api/auth/otp', 200, Date.now() - startTime)
        return createSuccessResponse(
            { sent: true },
            'Verification code sent',
            undefined,
            { origin }
        )

    } catch (error) {
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

        // 3. Verify ReCAPTCHA (Double check for security on verification too)
        const isHuman = await verifyRecaptcha(captchaToken, ip)
        if (!isHuman) {
            logApiRequest('PUT', '/api/auth/otp', 400, Date.now() - startTime)
            return createValidationErrorResponse(['Bot detected'], 'captcha', { origin })
        }

        // 4. Verify OTP via Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        })

        if (error) {
            logApiRequest('PUT', '/api/auth/otp', 401, Date.now() - startTime)
            return createUnauthorizedResponse('Invalid or expired code', { origin })
        }

        logApiRequest('PUT', '/api/auth/otp', 200, Date.now() - startTime)
        return createSuccessResponse(
            { session: data.session, user: data.user },
            'Successfully verified',
            undefined,
            { origin }
        )

    } catch (error) {
        logApiError(error as Error, { method: 'PUT', path: '/api/auth/otp' })
        return createInternalErrorResponse('Failed to verify code', undefined, { origin })
    }
}
