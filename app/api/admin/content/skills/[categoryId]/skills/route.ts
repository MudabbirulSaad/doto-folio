import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createSkillContentUseCases } from '@/lib/server/composition/content'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const principal = await authorizeAdminRequest(request, 'skills:create')

    const skill = await (await createSkillContentUseCases(principal)).createInCategory(categoryId, await request.json())
    return createSuccessResponse(skill, 'Skill created successfully')
  } catch (error) {
    console.error('Error in POST /api/admin/content/skills/[categoryId]/skills:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
