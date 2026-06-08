import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import { createAdminBlogTaxonomyUseCases } from '@/lib/server/composition/blog'
import { createApplicationErrorResponse } from '@/lib/server/adapters/http/errors'
import { isApplicationError } from '@/lib/server/domain/errors'

function taxonomyErrorResponse(error: unknown) {
  if (isApplicationError(error)) return createApplicationErrorResponse(error)
  return createErrorResponse('Internal server error', 500)
}

async function getCategoriesHandler() {
  try {
    const categories = await (await createAdminBlogTaxonomyUseCases()).listCategories()
    return createSuccessResponse(categories)
  } catch (error) {
    console.error('Error in getCategoriesHandler:', error)
    return taxonomyErrorResponse(error)
  }
}

async function createCategoryHandler({ request }: { request: NextRequest }) {
  try {
    const category = await (await createAdminBlogTaxonomyUseCases()).createCategory(await request.json())
    return createSuccessResponse(category, 201)
  } catch (error) {
    console.error('Error in createCategoryHandler:', error)
    return taxonomyErrorResponse(error)
  }
}

export const GET = withAuth(getCategoriesHandler)
export const POST = withAuth(createCategoryHandler)
