import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createContactContentUseCases } from '@/lib/server/composition/content'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function GET(request: NextRequest) {
  try {
    const principal = await authorizeAdminRequest(request, 'contact-content:read')

    const data = await (await createContactContentUseCases(principal)).get()
    return createSuccessResponse(data)
  } catch (error) {
    console.error('Error in GET /api/admin/content/contact:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await authorizeAdminRequest(request, 'contact-content:create')

    const result = await (await createContactContentUseCases(principal)).create(await request.json())
    return createSuccessResponse(result, 'Contact content created successfully')
  } catch (error) {
    console.error('Error in POST /api/admin/content/contact:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
