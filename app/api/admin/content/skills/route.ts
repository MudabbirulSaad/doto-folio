import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createSkillContentUseCases } from '@/lib/server/composition/content'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function GET(request: NextRequest) {
  try {
    const principal = await authorizeAdminRequest(request, 'skills:read')

    const skills = await (await createSkillContentUseCases(principal)).listFlat()
    return createSuccessResponse(skills)
  } catch (error) {
    console.error('Error in GET /api/admin/content/skills:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await authorizeAdminRequest(request, 'skills:create')

    const skill = await (await createSkillContentUseCases(principal)).createFlat(await request.json())
    return createSuccessResponse(skill, 'Skill created successfully')
  } catch (error) {
    console.error('Error in POST /api/admin/content/skills:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
