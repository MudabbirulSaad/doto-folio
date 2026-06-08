import { NextRequest } from 'next/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import { createPublicBlogListingUseCase } from '@/lib/server/composition/blog'
import type { BlogSearchParams } from '@/lib/types/blog'

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

    const getBlogListing = await createPublicBlogListingUseCase()
    const result = await getBlogListing(params, { defaultLimit: 12, maxLimit: 50, tagLimit: 20 })

    return createSuccessResponse({
      posts: result.posts,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasMore: result.hasMore,
      categories: result.categories,
      tags: result.tags
    }, 'Blog posts retrieved successfully')

  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch blog posts',
      [(error as Error).message]
    )
  }
}

export const GET = withPublicApi(getBlogPostsHandler)
