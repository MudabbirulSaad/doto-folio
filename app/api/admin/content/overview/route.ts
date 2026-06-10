import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createAdminContentOverviewUseCase } from '@/lib/server/composition/content'
import { NextRequest } from 'next/server'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function GET(request: NextRequest) {
  try {
    const principal = await authorizeAdminRequest(request, 'content-overview:read')

    const getOverview = await createAdminContentOverviewUseCase(principal)
    return createSuccessResponse(await getOverview())
  } catch (error) {
    console.error('Error in GET /api/admin/content/overview:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
