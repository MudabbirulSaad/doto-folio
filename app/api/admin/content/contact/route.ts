import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createContactContentUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse, createLegacyUnauthorizedResponse } from '@/lib/server/adapters/http/legacy-json-response'

export async function GET() {
  try {
    const data = await (await createContactContentUseCases()).get()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/admin/content/contact:', error)
    return createLegacyJsonErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) {
      return createLegacyUnauthorizedResponse()
    }

    const result = await (await createContactContentUseCases()).create(await request.json())
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/admin/content/contact:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
