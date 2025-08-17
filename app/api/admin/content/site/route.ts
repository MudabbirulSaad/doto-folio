import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse, createValidationErrorResponse } from '@/lib/api/response'

// GET - Fetch site content
async function getSiteContentHandler() {
  try {
    const supabase = await createClient()

    const { data: siteContent, error } = await supabase
      .from('site_content')
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to fetch site content: ${error.message}`)
    }

    return createSuccessResponse(siteContent, 'Site content retrieved successfully')
  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch site content',
      [(error as Error).message]
    )
  }
}

export const GET = withAuth(getSiteContentHandler)

// PUT - Update site content
async function updateSiteContentHandler(context: { request: NextRequest }) {
  try {
    const { request } = context
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
        return createValidationErrorResponse(
          [`${field} is required`],
          field
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
      throw new Error(`Failed to update site content: ${result.error.message}`)
    }

    return createSuccessResponse(
      result.data,
      'Site content updated successfully'
    )

  } catch (error) {
    return createInternalErrorResponse(
      'Failed to update site content',
      [(error as Error).message]
    )
  }
}

export const PUT = withAuth(updateSiteContentHandler)
