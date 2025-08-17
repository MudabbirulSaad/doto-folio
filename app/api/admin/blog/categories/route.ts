import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api/response'
import type { CreateBlogCategoryData } from '@/lib/types/blog'

// GET - Get all categories for admin
async function getCategoriesHandler() {
  try {
    const supabase = await createClient()
    
    const { data: categories, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return createErrorResponse('Failed to fetch categories', 500)
    }

    return createSuccessResponse(categories || [])

  } catch (error) {
    console.error('Error in getCategoriesHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// POST - Create new category
async function createCategoryHandler({ request }: { request: NextRequest }) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      description,
      color = '#3b82f6',
      display_order = 0
    }: CreateBlogCategoryData = body

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

    // Check if name or slug already exists
    const { data: existingCategory } = await supabase
      .from('blog_categories')
      .select('id, name, slug')
      .or(`name.eq.${name.trim()},slug.eq.${slug.trim()}`)
      .single()

    if (existingCategory) {
      if (existingCategory.name === name.trim()) {
        return createValidationErrorResponse('A category with this name already exists')
      }
      if (existingCategory.slug === slug.trim()) {
        return createValidationErrorResponse('A category with this slug already exists')
      }
    }

    // Create the category
    const { data: category, error } = await supabase
      .from('blog_categories')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        color,
        display_order,
        is_published: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return createErrorResponse('Failed to create category', 500)
    }

    return createSuccessResponse(category, 201)

  } catch (error) {
    console.error('Error in createCategoryHandler:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export const GET = withAuth(getCategoriesHandler)
export const POST = withAuth(createCategoryHandler)
