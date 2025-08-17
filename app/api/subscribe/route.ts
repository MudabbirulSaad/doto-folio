import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSubscriptionWelcomeEmail } from '@/lib/services/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing subscriber:', checkError)
      return NextResponse.json(
        { error: 'Failed to process subscription' },
        { status: 500 }
      )
    }

    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter' },
          { status: 409 }
        )
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({
            status: 'active',
            name: name || null,
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscriber.id)

        if (updateError) {
          console.error('Error reactivating subscription:', updateError)
          return NextResponse.json(
            { error: 'Failed to reactivate subscription' },
            { status: 500 }
          )
        }

        // Send welcome email for reactivated subscription
        const gmailUser = process.env.GMAIL_USER
        const gmailPass = process.env.GMAIL_PASS
        const adminEmail = process.env.ADMIN_EMAIL

        if (gmailUser && gmailPass) {
          try {
            await sendSubscriptionWelcomeEmail(name || '', email, {
              gmailUser,
              gmailPass,
              adminEmail: adminEmail || gmailUser, // Not used but required by interface
            })
          } catch (emailError) {
            console.error('Error sending reactivation emails:', emailError)
            // Don't fail the subscription if email fails
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Successfully reactivated your subscription!'
        })
      }
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('subscribers')
      .insert([
        {
          email: email.toLowerCase(),
          name: name || null,
          status: 'active'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating subscription:', error)
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    // Send welcome email and admin notification
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_PASS
    const adminEmail = process.env.ADMIN_EMAIL

    if (gmailUser && gmailPass) {
      try {
        await sendSubscriptionWelcomeEmail(name || '', email, {
          gmailUser,
          gmailPass,
          adminEmail: adminEmail || gmailUser, // Not used but required by interface
        })
      } catch (emailError) {
        console.error('Error sending subscription emails:', emailError)
        // Don't fail the subscription if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      subscriber: {
        id: data.id,
        email: data.email,
        name: data.name
      }
    })

  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
