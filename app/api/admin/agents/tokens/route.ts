import { requireAdminAuth } from '@/lib/auth/server'
import { createSuccessResponse } from '@/lib/api/response'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { createAgentAccessUseCases } from '@/lib/server/composition/agent-access'

export async function GET() {
  try {
    await requireAdminAuth()
    const tokens = await createAgentAccessUseCases().listTokens()
    return createSuccessResponse(tokens)
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
