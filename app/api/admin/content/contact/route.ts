import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createContactContentUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse } from '@/lib/server/adapters/http/legacy-json-response'

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'contact-content:read')

    const data = await (await createContactContentUseCases()).get()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/admin/content/contact:', error)
    return createLegacyJsonErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await authorizeAdminRequest(request, 'contact-content:create')

    const result = await (await createContactContentUseCases()).create(await request.json())
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/admin/content/contact:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
