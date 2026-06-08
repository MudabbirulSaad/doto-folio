import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createContactContentUseCases } from '@/lib/server/composition/content'
import { isApplicationError } from '@/lib/server/domain/errors'

function errorResponse(error: unknown) {
  if (isApplicationError(error)) {
    const status = error.code === 'VALIDATION_ERROR' ? 400 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export async function GET() {
  try {
    const data = await (await createContactContentUseCases()).get()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/admin/content/contact:', error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await (await createContactContentUseCases()).create(await request.json())
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/admin/content/contact:', error)
    return errorResponse(error)
  }
}
