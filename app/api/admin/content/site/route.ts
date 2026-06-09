import { NextRequest } from 'next/server'
import { withScopedAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createSiteContentUseCases } from '@/lib/server/composition/content'

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

export const GET = withScopedAuth(getSiteContentHandler, 'site-content:read')

async function updateSiteContentHandler(context: { request: NextRequest }) {
  try {
    const body = await context.request.json()
    const siteContent = await (await createSiteContentUseCases()).save(body)

    return createSuccessResponse(siteContent, 'Site content updated successfully')
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error, 'Failed to update site content')
  }
}

export const PUT = withScopedAuth(updateSiteContentHandler, 'site-content:update')
