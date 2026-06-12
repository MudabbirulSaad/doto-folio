import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createSkillCapabilityUseCases } from '@/lib/server/composition/content'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function GET(request: NextRequest) {
  try {
    const principal = await authorizeAdminRequest(request, 'skills:read')
    const capabilities = await (await createSkillCapabilityUseCases(principal)).list()
    return createSuccessResponse(capabilities)
  } catch (error) {
    console.error('Error in GET /api/admin/content/skill-capabilities:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await authorizeAdminRequest(request, 'skills:create')
    const capability = await (await createSkillCapabilityUseCases(principal)).createCapability(await request.json())
    return createSuccessResponse(capability, 'Skill capability created successfully')
  } catch (error) {
    console.error('Error in POST /api/admin/content/skill-capabilities:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
