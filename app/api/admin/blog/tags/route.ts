import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import type { CreateBlogTagData } from '@/lib/types/blog'

// GET - Get all tags for admin
async function getTagsHandler({ request }: { request: NextRequest }) {
  try {
    const supabase = await createClient()
    
    const { data: tags, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('usage_count', { ascending: false })

    if (error) {
      console.error('Error fetching tags:', error)
      return createErrorResponse('Failed to fetch tags', 500)
    }

    return createSuccessResponse(tags || [])

  } catch (error) {
    console.error('Error in getTagsHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// POST - Create new tag
async function createTagHandler({ request }: { request: NextRequest }) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      description
    }: CreateBlogTagData = body

    // Validation
    if (!name?.trim()) {
      return createValidationErrorResponse('Name is required')
    }

    if (!slug?.trim()) {
      return createValidationErrorResponse('Slug is required')
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug.trim())) {
      return createValidationErrorResponse('Slug must contain only lowercase letters, numbers, and hyphens')
    }

    const supabase = await createClient()

    // Check if name or slug already exists
    const { data: existingTag } = await supabase
      .from('blog_tags')
      .select('id, name, slug')
      .or(`name.eq.${name.trim()},slug.eq.${slug.trim()}`)
      .single()

    if (existingTag) {
      if (existingTag.name === name.trim()) {
        return createValidationErrorResponse('A tag with this name already exists')
      }
      if (existingTag.slug === slug.trim()) {
        return createValidationErrorResponse('A tag with this slug already exists')
      }
    }

    // Create the tag
    const { data: tag, error } = await supabase
      .from('blog_tags')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        usage_count: 0,
        is_published: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return createErrorResponse('Failed to create tag', 500)
    }

    return createSuccessResponse(tag, 201)

  } catch (error) {
    console.error('Error in createTagHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export const GET = withAuth(getTagsHandler)
export const POST = withAuth(createTagHandler)
