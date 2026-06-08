import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse } from '@/lib/api/response'
import { createAdminBlogTaxonomyUseCases } from '@/lib/server/composition/blog'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

async function getTagsHandler() {
  try {
    const tags = await (await createAdminBlogTaxonomyUseCases()).listTags()
    return createSuccessResponse(tags)
  } catch (error) {
    console.error('Error in getTagsHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

async function createTagHandler({ request }: { request: NextRequest }) {
  try {
    const tag = await (await createAdminBlogTaxonomyUseCases()).createTag(await request.json())
    return createSuccessResponse(tag, 201)
  } catch (error) {
    console.error('Error in createTagHandler:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export const GET = withAuth(getTagsHandler)
export const POST = withAuth(createTagHandler)
