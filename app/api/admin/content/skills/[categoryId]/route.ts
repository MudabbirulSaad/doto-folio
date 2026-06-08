import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createSkillContentUseCases } from '@/lib/server/composition/content'
import { isApplicationError } from '@/lib/server/domain/errors'

function errorResponse(error: unknown) {
  if (isApplicationError(error)) {
    const status = error.code === 'VALIDATION_ERROR' ? 400 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { categoryId: skillId } = await params
    const skill = await (await createSkillContentUseCases()).updateFlat(skillId, await request.json())
    return NextResponse.json({ data: skill, message: 'Skill updated successfully' })
  } catch (error) {
    console.error('Error in PUT /api/admin/content/skills/[id]:', error)
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { categoryId: skillId } = await params
    await (await createSkillContentUseCases()).delete(skillId)
    return NextResponse.json({ message: 'Skill deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/content/skills/[id]:', error)
    return errorResponse(error)
  }
}
