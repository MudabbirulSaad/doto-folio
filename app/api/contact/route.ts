import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendContactEmails } from '@/lib/services/email'
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
import type { ContactSubmissionInsert } from '@/lib/types/database'
import type { ContactFormData } from '@/lib/services/contact'

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

    // Create admin Supabase client (bypasses RLS)
    const supabase = createAdminClient()

    // Prepare data for insertion
    const submissionData: ContactSubmissionInsert = {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
    }

    // Insert into Supabase with error handling
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert(submissionData)
      .select()
      .single()

    if (error) {
      logApiError(new Error(`Database error: ${error.message}`), {
        method: 'POST',
        path: '/api/contact'
      })
      logApiRequest('POST', '/api/contact', 500, Date.now() - startTime)
      return createInternalErrorResponse(
        'Failed to submit your message. Please try again later.',
        undefined,
        { origin, rateLimitResult }
      )
    }

    // Send email notifications (don't fail the request if emails fail)
    let emailStatus = 'Email notifications disabled'
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_PASS
    const adminEmail = process.env.ADMIN_EMAIL

    if (gmailUser && gmailPass && adminEmail) {
      try {
        const emailResult = await sendContactEmails(formData, {
          gmailUser,
          gmailPass,
          adminEmail,
        })

        if (emailResult.success) {
          const emailParts = []
          if (emailResult.adminEmailSent) emailParts.push('admin notification sent')
          if (emailResult.userEmailSent) emailParts.push('confirmation email sent')
          emailStatus = `Email notifications: ${emailParts.join(', ')}`
        } else {
          emailStatus = `Email notifications failed: ${emailResult.error}`
          logApiError(new Error(`Email error: ${emailResult.error}`), {
            method: 'POST',
            path: '/api/contact'
          })
        }
      } catch (emailError) {
        emailStatus = 'Email notifications failed: service error'
        logApiError(emailError as Error, {
          method: 'POST',
          path: '/api/contact'
        })
      }
    }

    logApiRequest('POST', '/api/contact', 200, Date.now() - startTime)

    return createSuccessResponse(
      data,
      "Your message has been sent successfully! I'll get back to you soon.",
      undefined,
      {
        origin,
        rateLimitResult,
        headers: process.env.NODE_ENV === 'development' ? { 'X-Email-Status': emailStatus } : undefined
      }
    )

  } catch (error) {
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
