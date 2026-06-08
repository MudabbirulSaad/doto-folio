import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import { createPublicBlogTaxonomyUseCases } from '@/lib/server/composition/blog'

// GET - Fetch all blog categories with post counts
async function getBlogCategoriesHandler() {
  try {
    const categoriesWithCounts = await (await createPublicBlogTaxonomyUseCases()).categoriesWithCounts()

    return createSuccessResponse(categoriesWithCounts, 'Blog categories retrieved successfully')

  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch blog categories',
      [(error as Error).message]
    )
  }
}

export const GET = withPublicApi(getBlogCategoriesHandler)
