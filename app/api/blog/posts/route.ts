import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import type { BlogPost, BlogCategory, BlogTag, BlogSearchParams } from '@/lib/types/blog'

// GET - Fetch blog posts with filtering, search, and pagination
async function getBlogPostsHandler(context: { request: NextRequest }) {
  try {
    const { request } = context
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const params: BlogSearchParams = {
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '12'), 50), // Max 50 posts per page
      sortBy: (searchParams.get('sortBy') as any) || 'published_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    const supabase = await createClient()
    const offset = ((params.page || 1) - 1) * (params.limit || 12)

    // Build the query
    let query = supabase
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
      .eq('status', 'published')

    // Apply filters
    if (params.category) {
      query = query.eq('blog_categories.slug', params.category)
    }

    if (params.featured) {
      query = query.eq('featured', true)
    }

    if (params.query) {
      query = query.or(`title.ilike.%${params.query}%,excerpt.ilike.%${params.query}%,content.ilike.%${params.query}%`)
    }

    // Apply sorting
    const sortColumn = params.sortBy === 'published_at' ? 'published_at' : 
                      params.sortBy === 'view_count' ? 'view_count' :
                      params.sortBy === 'title' ? 'title' : 'created_at'
    
    query = query.order(sortColumn, { ascending: params.sortOrder === 'asc' })

    // Get total count for pagination
    const countQuery = supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    if (params.category) {
      countQuery.eq('blog_categories.slug', params.category)
    }
    if (params.featured) {
      countQuery.eq('is_featured', true)
    }
    if (params.query) {
      countQuery.or(`title.ilike.%${params.query}%,excerpt.ilike.%${params.query}%,content.ilike.%${params.query}%`)
    }

    // Execute queries
    const [postsResult, countResult] = await Promise.all([
      query.range(offset, offset + (params.limit || 12) - 1),
      countQuery
    ])

    if (postsResult.error) {
      throw new Error(`Failed to fetch blog posts: ${postsResult.error.message}`)
    }

    // Transform the data
    const posts: BlogPost[] = postsResult.data?.map(post => ({
      ...post,
      category: post.category || null,
      tags: post.tags?.map((t: any) => t.tag).filter(Boolean) || []
    })) || []

    const total = countResult.count || 0
    const hasMore = offset + (params.limit || 12) < total

    // Get categories and tags for filters
    const [categoriesResult, tagsResult] = await Promise.all([
      supabase
        .from('blog_categories')
        .select('*')
        .order('name'),
      supabase
        .from('blog_tags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(20)
    ])

    const categories: BlogCategory[] = categoriesResult.data || []
    const tags: BlogTag[] = tagsResult.data || []

    return createSuccessResponse({
      posts,
      total,
      page: params.page || 1,
      limit: params.limit || 12,
      hasMore,
      categories,
      tags
    }, 'Blog posts retrieved successfully')

  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch blog posts',
      [(error as Error).message]
    )
  }
}

export const GET = withPublicApi(getBlogPostsHandler)
