import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAdminContactSubmissionUseCases } from '@/lib/server/composition/contact'
import { exportContactSubmissions } from '@/lib/server/application/contact/admin-submissions'

// GET - Export contact submissions in various formats
export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'contact-submissions:export')

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const search = searchParams.get('search') || ''
    const readStatus = searchParams.get('readStatus') || 'all'
    const timeFilter = searchParams.get('timeFilter') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const submissions = await createAdminContactSubmissionUseCases().list({
      search,
      readStatus,
      timeFilter,
      startDate,
      endDate
    })
    const exportPayload = exportContactSubmissions(submissions || [], format)

    return new NextResponse(exportPayload.body, {
      headers: {
        'Content-Type': exportPayload.contentType,
        'Content-Disposition': `attachment; filename="${exportPayload.filename}"`
      }
    })
  } catch (error) {
    console.error('Export API error:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
