import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createAdminContactSubmissionUseCases } from '@/lib/server/composition/contact'
import { createLegacyJsonErrorResponse } from '@/lib/server/adapters/http/legacy-json-response'

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
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Submissions API error:', error)
    return createLegacyJsonErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'contact-submissions:update')
    const result = await createAdminContactSubmissionUseCases().updateReadStatus(await request.json())
    return NextResponse.json(result)
  } catch (error) {
    console.error('Update submissions API error:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
