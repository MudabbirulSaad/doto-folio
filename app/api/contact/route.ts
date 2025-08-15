import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendContactEmails } from '@/lib/services/email'
import type { ContactSubmissionInsert } from '@/lib/types/database'
import type { ContactFormData } from '@/lib/services/contact'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Prepare form data
    const formData: ContactFormData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
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

    // Insert into Supabase
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert(submissionData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to submit your message. Please try again later.' },
        { status: 500 }
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
          console.error('Email sending failed:', emailResult.error)
        }
      } catch (emailError) {
        emailStatus = 'Email notifications failed: service error'
        console.error('Email service error:', emailError)
      }
    }

    console.log(`Contact form submission processed: ${emailStatus}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully! I\'ll get back to you soon.',
        data,
        emailStatus: emailStatus // For debugging, remove in production if desired
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
