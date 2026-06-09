import { NextRequest } from 'next/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import { createPublicBlogListingUseCase } from '@/lib/server/composition/blog'
import type { BlogSearchParams } from '@/lib/types/blog'

const BLOG_POST_SORT_FIELDS = ['published_at', 'created_at', 'updated_at', 'view_count', 'title'] as const
const BLOG_POST_SORT_ORDERS = ['asc', 'desc'] as const

type BlogPostSortField = typeof BLOG_POST_SORT_FIELDS[number]
type BlogPostSortOrder = typeof BLOG_POST_SORT_ORDERS[number]

function isBlogPostSortField(value: string | null): value is BlogPostSortField {
  return BLOG_POST_SORT_FIELDS.includes(value as BlogPostSortField)
}

function isBlogPostSortOrder(value: string | null): value is BlogPostSortOrder {
  return BLOG_POST_SORT_ORDERS.includes(value as BlogPostSortOrder)
}

export function parseBlogPostSearchParams(searchParams: URLSearchParams): BlogSearchParams {
  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder')

  return {
    query: searchParams.get('query') || undefined,
    category: searchParams.get('category') || undefined,
    tag: searchParams.get('tag') || undefined,
    featured: searchParams.get('featured') === 'true' ? true : undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '12'), 50),
    sortBy: isBlogPostSortField(sortBy) ? sortBy : 'published_at',
    sortOrder: isBlogPostSortOrder(sortOrder) ? sortOrder : 'desc'
  }
}

// GET - Fetch blog posts with filtering, search, and pagination
async function getBlogPostsHandler(context: { request: NextRequest }) {
  try {
    const { request } = context
    const { searchParams } = new URL(request.url)
    const params = parseBlogPostSearchParams(searchParams)

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
