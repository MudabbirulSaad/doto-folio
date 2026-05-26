import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import type { BlogPost, BlogCategory, BlogTag, BlogSearchParams } from '@/lib/types/blog'

// Helper function to get filter conditions
async function getFilterConditions(params: BlogSearchParams, supabase: any) {
  const conditions: any = {}

  // Get category ID if category filter is provided
  if (params.category) {
    const { data: categoryData } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', params.category)
      .single()

    if (categoryData) {
      conditions.categoryId = categoryData.id
    }
  }

  // Get post IDs for tag filter if tag is provided
  if (params.tag) {
    const { data: tagData } = await supabase
      .from('blog_tags')
      .select('id')
      .eq('slug', params.tag)
      .single()

    if (tagData) {
      const { data: postIds } = await supabase
        .from('blog_post_tags')
        .select('post_id')
        .eq('tag_id', tagData.id)

      if (postIds && postIds.length > 0) {
        conditions.postIds = postIds.map((p: { post_id: string }) => p.post_id)
      } else {
        conditions.postIds = ['no-posts-found'] // Empty result
      }
    }
  }

  return conditions
}

// Helper function to apply filters to a query
function applyFiltersToQuery(query: any, params: BlogSearchParams, conditions: any) {
  // Apply category filter
  if (conditions.categoryId) {
    query = query.eq('category_id', conditions.categoryId)
  }

  // Apply tag filter
  if (conditions.postIds) {
    query = query.in('id', conditions.postIds)
  }

  // Apply featured filter
  if (params.featured) {
    query = query.eq('featured', true)
  }

  // Apply search filter
  if (params.query) {
    query = query.or(`title.ilike.%${params.query}%,excerpt.ilike.%${params.query}%,content.ilike.%${params.query}%`)
  }

  return query
}

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

    // Get filter conditions first
    const filterConditions = await getFilterConditions(params, supabase)

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

    // Apply filters using helper function
    query = applyFiltersToQuery(query, params, filterConditions)

    // Apply sorting
    const sortColumn = params.sortBy === 'published_at' ? 'published_at' : 
                      params.sortBy === 'view_count' ? 'view_count' :
                      params.sortBy === 'title' ? 'title' : 'created_at'
    
    query = query.order(sortColumn, { ascending: params.sortOrder === 'asc' })

    // Get total count for pagination (apply same filters)
    let countQuery = supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    // Apply the same filters to count query
    countQuery = applyFiltersToQuery(countQuery, params, filterConditions)

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
