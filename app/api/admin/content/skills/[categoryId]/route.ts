import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/auth/server'
import { createSkillContentUseCases } from '@/lib/server/composition/content'
import { createLegacyJsonErrorResponse, createLegacyUnauthorizedResponse } from '@/lib/server/adapters/http/legacy-json-response'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) return createLegacyUnauthorizedResponse()

    const { categoryId: skillId } = await params
    const skill = await (await createSkillContentUseCases()).updateFlat(skillId, await request.json())
    return NextResponse.json({ data: skill, message: 'Skill updated successfully' })
  } catch (error) {
    console.error('Error in PUT /api/admin/content/skills/[id]:', error)
    return createLegacyJsonErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentAdminUser()
    if (!user) return createLegacyUnauthorizedResponse()

    const { categoryId: skillId } = await params
    await (await createSkillContentUseCases()).delete(skillId)
    return NextResponse.json({ message: 'Skill deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/content/skills/[id]:', error)
    return createLegacyJsonErrorResponse(error)
  }
}
