import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createSkillCapabilityUseCases } from '@/lib/server/composition/content'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const principal = await authorizeAdminRequest(request, 'skills:update')
    const { id } = await params
    const capability = await (await createSkillCapabilityUseCases(principal)).updateCapability(id, await request.json())
    return createSuccessResponse(capability, 'Skill capability updated successfully')
  } catch (error) {
    console.error('Error in PUT /api/admin/content/skill-capabilities/[id]:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const principal = await authorizeAdminRequest(request, 'skills:delete')
    const { id } = await params
    await (await createSkillCapabilityUseCases(principal)).deleteCapability(id)
    return createSuccessResponse({ id }, 'Skill capability deleted successfully')
  } catch (error) {
    console.error('Error in DELETE /api/admin/content/skill-capabilities/[id]:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
