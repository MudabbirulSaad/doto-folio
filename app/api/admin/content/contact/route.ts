import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdminUser } from '@/lib/auth/server'

// GET - Fetch all contact methods and social links
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch contact methods
    const { data: contactMethods, error: contactError } = await supabase
      .from('contact_methods')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })

    if (contactError) {
      console.error('Error fetching contact methods:', contactError)
      return NextResponse.json(
        { error: 'Failed to fetch contact methods' },
        { status: 500 }
      )
    }

    // Fetch social links
    const { data: socialLinks, error: socialError } = await supabase
      .from('social_links')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })

    if (socialError) {
      console.error('Error fetching social links:', socialError)
      return NextResponse.json(
        { error: 'Failed to fetch social links' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      data: {
        contactMethods: contactMethods || [],
        socialLinks: socialLinks || []
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin/content/contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new contact method
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentAdminUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = await createClient()

    // Determine if this is a contact method or social link
    if (body.type === 'contact_method') {
      // Validate required fields for contact method
      if (!body.title || !body.value || !body.description || !body.link || !body.icon_name) {
        return NextResponse.json(
          { error: 'Title, value, description, link, and icon_name are required for contact methods' },
          { status: 400 }
        )
      }

      // Get next display order
      const { data: lastContact } = await supabase
        .from('contact_methods')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      const nextDisplayOrder = (lastContact?.display_order || 0) + 1

      // Create contact method
      const { data: contactMethod, error: contactError } = await supabase
        .from('contact_methods')
        .insert({
          title: body.title,
          value: body.value,
          description: body.description,
          link: body.link,
          icon_name: body.icon_name,
          display_order: body.display_order || nextDisplayOrder,
          is_published: body.is_published !== undefined ? body.is_published : true
        })
        .select()
        .single()

      if (contactError) {
        console.error('Error creating contact method:', contactError)
        return NextResponse.json(
          { error: 'Failed to create contact method' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        data: contactMethod,
        message: 'Contact method created successfully'
      })

    } else if (body.type === 'social_link') {
      // Validate required fields for social link
      if (!body.platform || !body.url || !body.icon_name) {
        return NextResponse.json(
          { error: 'Platform, url, and icon_name are required for social links' },
          { status: 400 }
        )
      }

      // Get next display order
      const { data: lastSocial } = await supabase
        .from('social_links')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      const nextDisplayOrder = (lastSocial?.display_order || 0) + 1

      // Create social link
      const { data: socialLink, error: socialError } = await supabase
        .from('social_links')
        .insert({
          platform: body.platform,
          url: body.url,
          username: body.username || null,
          icon_name: body.icon_name,
          display_order: body.display_order || nextDisplayOrder,
          is_published: body.is_published !== undefined ? body.is_published : true
        })
        .select()
        .single()

      if (socialError) {
        console.error('Error creating social link:', socialError)
        return NextResponse.json(
          { error: 'Failed to create social link' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        data: socialLink,
        message: 'Social link created successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "contact_method" or "social_link"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in POST /api/admin/content/contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
