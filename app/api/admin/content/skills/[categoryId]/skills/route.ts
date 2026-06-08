import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createSkillContentUseCases } from '@/lib/server/composition/content'
import { isApplicationError } from '@/lib/server/domain/errors'

function errorResponse(error: unknown) {
  if (isApplicationError(error)) {
    const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'VALIDATION_ERROR' ? 400 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const user = await getCurrentAdminUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const skill = await (await createSkillContentUseCases()).createInCategory(categoryId, await request.json())
    return NextResponse.json({ data: skill, message: 'Skill created successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/content/skills/[categoryId]/skills:', error)
    return errorResponse(error)
  }
}
