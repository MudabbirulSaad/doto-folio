import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, createValidationErrorResponse } from '@/lib/api/response'
import { requireAdminAuth } from '@/lib/auth/server'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

const ApprovalSchema = z.object({
  approvedScopes: z.array(z.string()).min(1)
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth()
    const parsed = ApprovalSchema.safeParse(await request.json())
    if (!parsed.success) {
      return createValidationErrorResponse(parsed.error.issues.map(issue => issue.message))
    }

    const { id } = await params
    const result = await createAgentAccessUseCases().approveRequest({
      id,
      approvedScopes: parsed.data.approvedScopes,
      adminUserId: admin.id
    })

    return createSuccessResponse(result, 'Agent access request approved')
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
