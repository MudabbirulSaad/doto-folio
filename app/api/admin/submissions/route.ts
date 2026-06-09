import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createAdminContactSubmissionUseCases } from '@/lib/server/composition/contact'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

function filtersFromRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  return {
    search: searchParams.get('search') || '',
    readStatus: searchParams.get('readStatus') || 'all',
    timeFilter: searchParams.get('timeFilter') || 'all',
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate')
  }
}

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'contact-submissions:read')
    const submissions = await createAdminContactSubmissionUseCases().list(filtersFromRequest(request))
    return createSuccessResponse({ submissions })
  } catch (error) {
    console.error('Submissions API error:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'contact-submissions:update')
    const result = await createAdminContactSubmissionUseCases().updateReadStatus(await request.json())
    return createSuccessResponse(result, 'Submission read status updated')
  } catch (error) {
    console.error('Update submissions API error:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
