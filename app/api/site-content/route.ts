import { withPublicApi } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import { createSiteContentUseCases } from '@/lib/server/composition/content'

async function getSiteContentHandler() {
  try {
    const { content, message } = await (await createSiteContentUseCases()).getPublished()
    return createSuccessResponse(content, message)
  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch site content',
      [(error as Error).message]
    )
  }
}

export const GET = withPublicApi(getSiteContentHandler)
