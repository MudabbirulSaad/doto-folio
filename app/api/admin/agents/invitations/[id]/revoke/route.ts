import { createSuccessResponse } from '@/lib/api/response'
import { requireAdminAuth } from '@/lib/auth/server'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth()
    const { id } = await params
    const invitation = await createAgentAccessUseCases().revokeInvitation({
      id,
      adminUserId: admin.id
    })
    return createSuccessResponse(invitation, 'Agent invitation revoked')
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
