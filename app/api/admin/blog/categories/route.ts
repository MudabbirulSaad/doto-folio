import { NextRequest } from 'next/server'
import { withScopedAuth } from '@/lib/api/middleware'
import { createSuccessResponse } from '@/lib/api/response'
import { createAdminBlogTaxonomyUseCases } from '@/lib/server/composition/blog'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

async function getCategoriesHandler() {
  try {
    const categories = await (await createAdminBlogTaxonomyUseCases()).listCategories()
    return createSuccessResponse(categories)
  } catch (error) {
    console.error('Error in getCategoriesHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

async function createCategoryHandler({ request }: { request: NextRequest }) {
  try {
    const category = await (await createAdminBlogTaxonomyUseCases()).createCategory(await request.json())
    return createSuccessResponse(category, 201)
  } catch (error) {
    console.error('Error in createCategoryHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export const GET = withScopedAuth(getCategoriesHandler, 'blog-taxonomy:read')
export const POST = withScopedAuth(createCategoryHandler, 'blog-categories:create')
