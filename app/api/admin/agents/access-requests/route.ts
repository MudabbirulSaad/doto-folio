import { createSuccessResponse } from '@/lib/api/response'
import { requireAdminAuth } from '@/lib/auth/server'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

export async function GET() {
  try {
    await requireAdminAuth()
    const requests = await createAgentAccessUseCases().listRequests()
    return createSuccessResponse(requests)
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
