import { NextRequest, NextResponse } from 'next/server'
import { createNewsletterSubscriptionUseCase } from '@/lib/server/composition/subscriptions'
import { isApplicationError } from '@/lib/server/domain/errors'

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

    const result = await createNewsletterSubscriptionUseCase()({ name, email })

    if (result.status === 'reactivated') {
      return NextResponse.json({
        success: true,
        message: 'Successfully reactivated your subscription!'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      subscriber: {
        id: result.subscriber.id,
        email: result.subscriber.email,
        name: result.subscriber.name
      }
    })

  } catch (error) {
    if (isApplicationError(error)) {
      const status = error.code === 'FORBIDDEN' ? 409 : 500
      return NextResponse.json({ error: error.message }, { status })
    }

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
