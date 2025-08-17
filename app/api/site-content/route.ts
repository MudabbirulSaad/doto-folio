import { createClient } from '@/lib/supabase/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'

// GET - Fetch published site content (public endpoint)
async function getSiteContentHandler() {
  try {
    const supabase = await createClient()
    
    const { data: siteContent, error } = await supabase
      .from('site_content')
      .select(`
        hero_title,
        hero_subtitle,
        hero_cta_text,
        hero_cta_link,
        about_title,
        about_intro,
        about_description,
        about_personal,
        education_title,
        education_degree,
        education_field,
        education_institution,
        approach_title,
        approach_description,
        contact_title,
        contact_description,
        contact_opportunities_title,
        contact_opportunities_description,
        footer_brand_name,
        footer_brand_description,
        footer_location,
        footer_university,
        footer_field,
        footer_copyright
      `)
      .eq('is_published', true)
      .single()

    if (error) {
      // If no published content found, return default content
      if (error.code === 'PGRST116') {
        const defaultContent = {
          hero_title: 'I build beautiful and intelligent digital experiences.',
          hero_subtitle: null,
          hero_cta_text: 'Explore My Work',
          hero_cta_link: '#projects',
          about_title: 'About Me',
          about_intro: 'Welcome to my portfolio',
          about_description: 'I am passionate about creating innovative solutions.',
          about_personal: 'Currently studying AI at Swinburne University.',
          education_title: 'Education',
          education_degree: 'Bachelor of Computer Science',
          education_field: 'Artificial Intelligence',
          education_institution: 'Swinburne University of Technology',
          approach_title: 'My Approach',
          approach_description: 'I believe in creating user-centered solutions.',
          contact_title: "Let's Connect",
          contact_description: 'Feel free to reach out for collaborations.',
          contact_opportunities_title: 'Open to Opportunities',
          contact_opportunities_description: 'Always interested in new projects.',
          footer_brand_name: 'SAAD',
          footer_brand_description: 'Building the future with AI',
          footer_location: 'Melbourne, Australia',
          footer_university: 'Swinburne University',
          footer_field: 'Artificial Intelligence',
          footer_copyright: '© 2024 Mudabbirul Saad. All rights reserved.'
        }
        
        return createSuccessResponse(
          defaultContent, 
          'Default site content returned (no published content found)'
        )
      }
      
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

export const GET = withPublicApi(getSiteContentHandler)
