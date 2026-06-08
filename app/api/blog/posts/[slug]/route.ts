import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/api/response'
import { createBlogPostDetailUseCase } from '@/lib/server/composition/blog'
import type { BlogPostViewContext } from '@/lib/server/application/blog/blog-post-detail'
import type { ApiContext } from '@/lib/api/middleware'

type BlogPostRouteContext = { params: { slug: string } }

async function getBlogPostHandler(_: ApiContext, context: BlogPostRouteContext) {
  try {
    const { slug } = context.params
    const service = await createBlogPostDetailUseCase()

    const { post, relatedPosts } = await service.readDetail(slug, 3)

    if (!post) {
      return createNotFoundErrorResponse('Blog post not found')
    }

    return createSuccessResponse({
      post,
      relatedPosts
    }, 'Blog post retrieved successfully')
  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch blog post',
      [(error as Error).message]
    )
  }
}

async function trackBlogPostViewHandler(context: ApiContext, routeContext: BlogPostRouteContext) {
  try {
    const { request } = context
    const { slug } = routeContext.params
    const service = await createBlogPostDetailUseCase()

    const post = await service.readMetadata(slug)
    if (!post) {
      return createNotFoundErrorResponse('Blog post not found')
    }

    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrerHeader = request.headers.get('referer')
    let body: { referrer?: string } = {}

    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const contextPayload: BlogPostViewContext = {
      ipAddress: clientIP,
      userAgent,
      referrer: body.referrer || referrerHeader || null
    }

    await service.trackView(slug, contextPayload)
    return createSuccessResponse({ success: true }, 'View tracked successfully')
  } catch (error) {
    return createInternalErrorResponse(
      'Failed to track view',
      [(error as Error).message]
    )
  }
}

export const GET = withPublicApi(getBlogPostHandler)
export const POST = withPublicApi(trackBlogPostViewHandler)
