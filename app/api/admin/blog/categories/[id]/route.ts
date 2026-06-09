import { NextRequest } from 'next/server'
import { withScopedAuth } from '@/lib/api/middleware'
import { createSuccessResponse } from '@/lib/api/response'
import { createAdminBlogTaxonomyUseCases } from '@/lib/server/composition/blog'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

async function getCategoryHandler(_: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const category = await (await createAdminBlogTaxonomyUseCases()).getCategory(params.id)
    return createSuccessResponse(category)
  } catch (error) {
    console.error('Error in getCategoryHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

async function updateCategoryHandler({ request }: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const category = await (await createAdminBlogTaxonomyUseCases()).updateCategory(params.id, await request.json())
    return createSuccessResponse(category)
  } catch (error) {
    console.error('Error in updateCategoryHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

async function deleteCategoryHandler(_: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const result = await (await createAdminBlogTaxonomyUseCases()).deleteCategory(params.id)
    return createSuccessResponse(result)
  } catch (error) {
    console.error('Error in deleteCategoryHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export const GET = withScopedAuth(getCategoryHandler, 'blog-taxonomy:read')
export const PUT = withScopedAuth(updateCategoryHandler, 'blog-categories:update')
export const DELETE = withScopedAuth(deleteCategoryHandler, 'blog-categories:delete')
