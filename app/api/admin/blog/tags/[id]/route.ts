import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse } from '@/lib/api/response'
import { createAdminBlogTaxonomyUseCases } from '@/lib/server/composition/blog'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

async function getTagHandler(_: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const tag = await (await createAdminBlogTaxonomyUseCases()).getTag(params.id)
    return createSuccessResponse(tag)
  } catch (error) {
    console.error('Error in getTagHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

async function updateTagHandler({ request }: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const tag = await (await createAdminBlogTaxonomyUseCases()).updateTag(params.id, await request.json())
    return createSuccessResponse(tag)
  } catch (error) {
    console.error('Error in updateTagHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

async function deleteTagHandler(_: { request: NextRequest }, { params }: { params: { id: string } }) {
  try {
    const result = await (await createAdminBlogTaxonomyUseCases()).deleteTag(params.id)
    return createSuccessResponse(result)
  } catch (error) {
    console.error('Error in deleteTagHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export const GET = withAuth(getTagHandler)
export const PUT = withAuth(updateTagHandler)
export const DELETE = withAuth(deleteTagHandler)
