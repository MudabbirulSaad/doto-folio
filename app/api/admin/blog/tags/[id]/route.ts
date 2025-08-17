import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import type { UpdateBlogTagData } from '@/lib/types/blog'

// GET - Get single tag
async function getTagHandler({ request }: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    const { data: tag, error } = await supabase
      .from('blog_tags')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching tag:', error)
      return createErrorResponse('Tag not found', 404)
    }

    return createSuccessResponse(tag)

  } catch (error) {
    console.error('Error in getTagHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// PUT - Update tag
async function updateTagHandler({ request }: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      description
    }: UpdateBlogTagData = body

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

    // Check if tag exists
    const { data: existingTag } = await supabase
      .from('blog_tags')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!existingTag) {
      return createErrorResponse('Tag not found', 404)
    }

    // Check if name or slug already exists (excluding current tag)
    const { data: duplicateTag } = await supabase
      .from('blog_tags')
      .select('id, name, slug')
      .or(`name.eq.${name.trim()},slug.eq.${slug.trim()}`)
      .neq('id', params.id)
      .single()

    if (duplicateTag) {
      if (duplicateTag.name === name.trim()) {
        return createValidationErrorResponse('A tag with this name already exists')
      }
      if (duplicateTag.slug === slug.trim()) {
        return createValidationErrorResponse('A tag with this slug already exists')
      }
    }

    // Update the tag
    const { data: tag, error } = await supabase
      .from('blog_tags')
      .update({
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating tag:', error)
      return createErrorResponse('Failed to update tag', 500)
    }

    return createSuccessResponse(tag)

  } catch (error) {
    console.error('Error in updateTagHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// DELETE - Delete tag
async function deleteTagHandler({ request }: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check if tag exists and get usage count
    const { data: tag, error: fetchError } = await supabase
      .from('blog_tags')
      .select('id, name, usage_count')
      .eq('id', params.id)
      .single()

    if (fetchError || !tag) {
      return createErrorResponse('Tag not found', 404)
    }

    // Remove tag from all posts (cascade delete will handle blog_post_tags)
    const { error: deleteError } = await supabase
      .from('blog_tags')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting tag:', deleteError)
      return createErrorResponse('Failed to delete tag', 500)
    }

    return createSuccessResponse({ 
      message: 'Tag deleted successfully',
      postsAffected: tag.usage_count 
    })

  } catch (error) {
    console.error('Error in deleteTagHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export const GET = withAuth(getTagHandler)
export const PUT = withAuth(updateTagHandler)
export const DELETE = withAuth(deleteTagHandler)
