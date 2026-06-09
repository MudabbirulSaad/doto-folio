import { NextRequest } from 'next/server'
import { createSuccessResponse, createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/api/response'
import { createPublicBlogTaxonomyUseCases } from '@/lib/server/composition/blog'
import { isApplicationError } from '@/lib/server/domain/errors'

// GET - Fetch blog posts by tag
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)
    const response = await (await createPublicBlogTaxonomyUseCases())
      .postsByTag(params.slug, { page, limit })

    return createSuccessResponse(response, `Posts tagged with "${response.tag.name}" retrieved successfully`)

  } catch (error) {
    if (isApplicationError(error) && error.code === 'NOT_FOUND') {
      return createNotFoundErrorResponse(error.message)
    }

    return createInternalErrorResponse(
      'Failed to fetch tag posts',
      [(error as Error).message]
    )
  }
}


