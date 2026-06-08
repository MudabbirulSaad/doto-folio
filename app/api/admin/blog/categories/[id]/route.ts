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

async function getCategoryHandler(_: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const category = await (await createAdminBlogTaxonomyUseCases()).getCategory(params.id)
    return createSuccessResponse(category)
  } catch (error) {
    console.error('Error in getCategoryHandler:', error)
    return taxonomyErrorResponse(error)
  }
}

async function updateCategoryHandler({ request }: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const category = await (await createAdminBlogTaxonomyUseCases()).updateCategory(params.id, await request.json())
    return createSuccessResponse(category)
  } catch (error) {
    console.error('Error in updateCategoryHandler:', error)
    return taxonomyErrorResponse(error)
  }
}

async function deleteCategoryHandler(_: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const result = await (await createAdminBlogTaxonomyUseCases()).deleteCategory(params.id)
    return createSuccessResponse(result)
  } catch (error) {
    console.error('Error in deleteCategoryHandler:', error)
    return taxonomyErrorResponse(error)
  }
}

export const GET = withAuth(getCategoryHandler)
export const PUT = withAuth(updateCategoryHandler)
export const DELETE = withAuth(deleteCategoryHandler)
