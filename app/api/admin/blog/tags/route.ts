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

async function getTagsHandler() {
  try {
    const tags = await (await createAdminBlogTaxonomyUseCases()).listTags()
    return createSuccessResponse(tags)
  } catch (error) {
    console.error('Error in getTagsHandler:', error)
    return taxonomyErrorResponse(error)
  }
}

async function createTagHandler({ request }: { request: NextRequest }) {
  try {
    const tag = await (await createAdminBlogTaxonomyUseCases()).createTag(await request.json())
    return createSuccessResponse(tag, 201)
  } catch (error) {
    console.error('Error in createTagHandler:', error)
    return taxonomyErrorResponse(error)
  }
}

export const GET = withAuth(getTagsHandler)
export const POST = withAuth(createTagHandler)
