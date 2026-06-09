import { requireAdminAuth } from '@/lib/auth/server'
import { createSuccessResponse } from '@/lib/api/response'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth()
    const { id } = await params
    const token = await createAgentAccessUseCases().revokeToken({
      id,
      adminUserId: admin.id
    })

    return createSuccessResponse(token, 'Agent token revoked')
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
