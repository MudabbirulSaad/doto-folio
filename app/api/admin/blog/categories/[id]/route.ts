import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import type { UpdateBlogCategoryData } from '@/lib/types/blog'

// GET - Get single category
async function getCategoryHandler({ request }: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    const { data: category, error } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching category:', error)
      return createErrorResponse('Category not found', 404)
    }

    return createSuccessResponse(category)

  } catch (error) {
    console.error('Error in getCategoryHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// PUT - Update category
async function updateCategoryHandler({ request }: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      description,
      color = '#3b82f6',
      display_order = 0
    }: UpdateBlogCategoryData = body

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

    // Validate color format
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!colorRegex.test(color)) {
      return createValidationErrorResponse('Color must be a valid hex color (e.g., #3b82f6)')
    }

    const supabase = await createClient()

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!existingCategory) {
      return createErrorResponse('Category not found', 404)
    }

    // Check if name or slug already exists (excluding current category)
    const { data: duplicateCategory } = await supabase
      .from('blog_categories')
      .select('id, name, slug')
      .or(`name.eq.${name.trim()},slug.eq.${slug.trim()}`)
      .neq('id', params.id)
      .single()

    if (duplicateCategory) {
      if (duplicateCategory.name === name.trim()) {
        return createValidationErrorResponse('A category with this name already exists')
      }
      if (duplicateCategory.slug === slug.trim()) {
        return createValidationErrorResponse('A category with this slug already exists')
      }
    }

    // Update the category
    const { data: category, error } = await supabase
      .from('blog_categories')
      .update({
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        color,
        display_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return createErrorResponse('Failed to update category', 500)
    }

    return createSuccessResponse(category)

  } catch (error) {
    console.error('Error in updateCategoryHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// DELETE - Delete category
async function deleteCategoryHandler({ request }: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check if category exists and get post count
    const { data: category, error: fetchError } = await supabase
      .from('blog_categories')
      .select(`
        id,
        name,
        post_count:blog_posts(count)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !category) {
      return createErrorResponse('Category not found', 404)
    }

    const postCount = category.post_count?.[0]?.count || 0

    // If category has posts, set their category_id to null instead of deleting
    if (postCount > 0) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ category_id: null })
        .eq('category_id', params.id)

      if (updateError) {
        console.error('Error updating posts:', updateError)
        return createErrorResponse('Failed to update posts', 500)
      }
    }

    // Delete the category
    const { error: deleteError } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return createErrorResponse('Failed to delete category', 500)
    }

    return createSuccessResponse({ 
      message: 'Category deleted successfully',
      postsUpdated: postCount 
    })

  } catch (error) {
    console.error('Error in deleteCategoryHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export const GET = withAuth(getCategoryHandler)
export const PUT = withAuth(updateCategoryHandler)
export const DELETE = withAuth(deleteCategoryHandler)
