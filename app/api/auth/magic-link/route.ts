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
    logApiRequest,
    logApiError
} from '@/lib/api/response'

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

        // 3. Verify ReCAPTCHA
        const secretKey = process.env.RECAPTCHA_SECRET_KEY
        if (!secretKey) {
            throw new Error('RECAPTCHA_SECRET_KEY is not defined')
        }

        const verificationResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: secretKey,
                response: captchaToken,
                remoteip: ip
            }).toString(),
        })

        if (!verificationResponse.ok) {
            throw new Error('Failed to verify reCAPTCHA')
        }

        const verificationResult = await verificationResponse.json()
        if (!verificationResult.success || (verificationResult.score && verificationResult.score < 0.5)) {
            logApiRequest('POST', '/api/auth/magic-link', 400, Date.now() - startTime)
            return createValidationErrorResponse(['Bot detected or low score'], 'captcha', { origin })
        }

        // 4. Send Magic Link via Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${origin}/auth/confirm?next=/blog`, // Redirect to client-side confirm for Implicit Flow
                shouldCreateUser: true // Allow new users to sign up via comments
            }
        })

        if (error) {
            throw error
        }

        logApiRequest('POST', '/api/auth/magic-link', 200, Date.now() - startTime)
        return createSuccessResponse(
            { sent: true },
            'Magic link sent successfully',
            undefined,
            { origin }
        )

    } catch (error) {
        logApiError(error as Error, { method: 'POST', path: '/api/auth/magic-link' })
        return createInternalErrorResponse(
            'Failed to send magic link',
            undefined,
            { origin }
        )
    }
}
