import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSuccessResponse, createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/api/response'
import type { BlogCategoryResponse } from '@/lib/types/blog'

// GET - Fetch blog posts by category
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // First, get the category
    const { data: category, error: categoryError } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (categoryError || !category) {
      return createNotFoundErrorResponse('Blog category not found')
    }

    // Get posts in this category
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(
          id,
          name,
          slug,
          color
        ),
        tags:blog_post_tags(
          tag:blog_tags(
            id,
            name,
            slug
          )
        )
      `)
      .eq('category_id', category.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      throw new Error(`Failed to fetch category posts: ${postsError.message}`)
    }

    // Get total count for pagination
    const { count: total, error: countError } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('status', 'published')

    if (countError) {
      throw new Error(`Failed to count category posts: ${countError.message}`)
    }

    // Transform posts data
    const transformedPosts = posts?.map(post => ({
      ...post,
      category: post.category || null,
      tags: post.tags?.map((t: { tag: unknown }) => t.tag).filter(Boolean) || []
    })) || []

    const hasMore = offset + limit < (total || 0)

    const response: BlogCategoryResponse = {
      category,
      posts: transformedPosts,
      total: total || 0,
      page,
      limit,
      hasMore
    }

    return createSuccessResponse(response, `Posts in category "${category.name}" retrieved successfully`)

  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch category posts',
      [(error as Error).message]
    )
  }
}


