import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createSkillContentUseCases } from '@/lib/server/composition/content'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const principal = await authorizeAdminRequest(request, 'skills:update')

    const { categoryId: skillId } = await params
    const skill = await (await createSkillContentUseCases(principal)).updateFlat(skillId, await request.json())
    return createSuccessResponse(skill, 'Skill updated successfully')
  } catch (error) {
    console.error('Error in PUT /api/admin/content/skills/[id]:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const principal = await authorizeAdminRequest(_request, 'skills:delete')

    const { categoryId: skillId } = await params
    await (await createSkillContentUseCases(principal)).delete(skillId)
    return createSuccessResponse({ id: skillId }, 'Skill deleted successfully')
  } catch (error) {
    console.error('Error in DELETE /api/admin/content/skills/[id]:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
