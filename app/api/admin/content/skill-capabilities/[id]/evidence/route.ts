import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api/response'
import { authorizeAdminRequest } from '@/lib/auth/api-authorization'
import { createSkillCapabilityUseCases } from '@/lib/server/composition/content'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const principal = await authorizeAdminRequest(request, 'skills:create')
    const { id } = await params
    const evidence = await (await createSkillCapabilityUseCases(principal)).createEvidence(id, await request.json())
    return createSuccessResponse(evidence, 'Skill evidence created successfully')
  } catch (error) {
    console.error('Error in POST /api/admin/content/skill-capabilities/[id]/evidence:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}
