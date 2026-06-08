import { createSuccessResponse, createUnauthorizedResponse, createInternalErrorResponse } from '@/lib/api/response'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createAdminContentOverviewUseCase } from '@/lib/server/composition/content'

export async function GET() {
  try {
    const user = await getCurrentAdminUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const getOverview = await createAdminContentOverviewUseCase()
    return createSuccessResponse(await getOverview())
  } catch (error) {
    console.error('Error in GET /api/admin/content/overview:', error)
    return createInternalErrorResponse()
  }
}
