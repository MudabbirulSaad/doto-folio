import { createClient } from '@/lib/supabase/server'
import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createNotFoundResponse, createInternalErrorResponse } from '@/lib/api/response'
import {
  createBlogPostDetailService,
  createSupabaseBlogPostDetailRepository
} from '@/lib/data/blog-post-detail'
import type { ApiContext } from '@/lib/api/middleware'

type RecommendationRouteContext = { params: { slug: string } }

async function getRecommendationsHandler(_: ApiContext, context: RecommendationRouteContext) {
  try {
    const { slug } = context.params
    if (!slug) {
      return createNotFoundResponse('Blog post slug not provided')
    }

    const supabase = await createClient()
    const service = createBlogPostDetailService(createSupabaseBlogPostDetailRepository(supabase))

    const post = await service.readMetadata(slug)
    if (!post) {
      return createNotFoundResponse('Blog post not found')
    }

    const recommendations = await service.getRecommendations(slug, 3)

    return createSuccessResponse({
      recommendations,
      total: recommendations.length,
      algorithm: 'hybrid_content_category'
    })
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return createInternalErrorResponse('Failed to get recommendations')
  }
}

export const GET = withPublicApi(getRecommendationsHandler)
