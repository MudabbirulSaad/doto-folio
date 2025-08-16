import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdminUser } from '@/lib/auth/server'

// GET - Fetch site content
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: siteContent, error } = await supabase
      .from('site_content')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching site content:', error)
      return NextResponse.json(
        { error: 'Failed to fetch site content' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: siteContent })
  } catch (error) {
    console.error('Error in GET /api/admin/content/site:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update site content
export async function PUT(request: NextRequest) {
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

    // Validate required fields
    const requiredFields = [
      'hero_title',
      'hero_cta_text',
      'about_intro',
      'about_description',
      'about_personal',
      'education_degree',
      'education_field',
      'education_institution',
      'approach_description'
    ]

    for (const field of requiredFields) {
      if (!body[field] || body[field].trim() === '') {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Check if site content exists
    const { data: existingContent } = await supabase
      .from('site_content')
      .select('id')
      .single()

    let result

    if (existingContent) {
      // Update existing content
      const { data, error } = await supabase
        .from('site_content')
        .update({
          hero_title: body.hero_title,
          hero_subtitle: body.hero_subtitle || null,
          hero_cta_text: body.hero_cta_text,
          hero_cta_link: body.hero_cta_link || '#projects',
          about_title: body.about_title || 'About Me',
          about_intro: body.about_intro,
          about_description: body.about_description,
          about_personal: body.about_personal,
          education_title: body.education_title || 'Education',
          education_degree: body.education_degree,
          education_field: body.education_field,
          education_institution: body.education_institution,
          approach_title: body.approach_title || 'Approach',
          approach_description: body.approach_description,
          contact_title: body.contact_title || 'Let\'s Connect',
          contact_description: body.contact_description || '',
          contact_opportunities_title: body.contact_opportunities_title || 'Open to Opportunities',
          contact_opportunities_description: body.contact_opportunities_description || '',
          footer_brand_name: body.footer_brand_name || 'SAAD',
          footer_brand_description: body.footer_brand_description || '',
          footer_location: body.footer_location || '',
          footer_university: body.footer_university || '',
          footer_field: body.footer_field || '',
          footer_copyright: body.footer_copyright || '',
          is_published: body.is_published !== undefined ? body.is_published : true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      result = { data, error }
    } else {
      // Insert new content
      const { data, error } = await supabase
        .from('site_content')
        .insert({
          hero_title: body.hero_title,
          hero_subtitle: body.hero_subtitle || null,
          hero_cta_text: body.hero_cta_text,
          hero_cta_link: body.hero_cta_link || '#projects',
          about_title: body.about_title || 'About Me',
          about_intro: body.about_intro,
          about_description: body.about_description,
          about_personal: body.about_personal,
          education_title: body.education_title || 'Education',
          education_degree: body.education_degree,
          education_field: body.education_field,
          education_institution: body.education_institution,
          approach_title: body.approach_title || 'Approach',
          approach_description: body.approach_description,
          contact_title: body.contact_title || 'Let\'s Connect',
          contact_description: body.contact_description || '',
          contact_opportunities_title: body.contact_opportunities_title || 'Open to Opportunities',
          contact_opportunities_description: body.contact_opportunities_description || '',
          footer_brand_name: body.footer_brand_name || 'SAAD',
          footer_brand_description: body.footer_brand_description || '',
          footer_location: body.footer_location || '',
          footer_university: body.footer_university || '',
          footer_field: body.footer_field || '',
          footer_copyright: body.footer_copyright || '',
          is_published: body.is_published !== undefined ? body.is_published : true
        })
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error('Error updating site content:', result.error)
      return NextResponse.json(
        { error: 'Failed to update site content' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      data: result.data,
      message: 'Site content updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/content/site:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
