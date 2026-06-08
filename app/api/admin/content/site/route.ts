import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import { createApplicationErrorResponse } from '@/lib/server/adapters/http/errors'
import { createSiteContentUseCases } from '@/lib/server/composition/content'
import { isApplicationError } from '@/lib/server/domain/errors'

async function getSiteContentHandler() {
  try {
    const siteContent = await (await createSiteContentUseCases()).getAdmin()
    return createSuccessResponse(siteContent, 'Site content retrieved successfully')
  } catch (error) {
    return createInternalErrorResponse(
      'Failed to fetch site content',
      [(error as Error).message]
    )
  }
}

export const GET = withAuth(getSiteContentHandler)

async function updateSiteContentHandler(context: { request: NextRequest }) {
  try {
    const body = await context.request.json()
    const siteContent = await (await createSiteContentUseCases()).save(body)

    return createSuccessResponse(siteContent, 'Site content updated successfully')
  } catch (error) {
    if (isApplicationError(error)) {
      return createApplicationErrorResponse(error)
    }

    return createInternalErrorResponse(
      'Failed to update site content',
      [(error as Error).message]
    )
  }
}

export const PUT = withAuth(updateSiteContentHandler)
