import { createSuccessResponse } from '@/lib/api/response'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { readPublicAgentContext } from '@/lib/server/composition/agent-access'

export async function GET() {
  try {
    const context = await readPublicAgentContext()
    return createSuccessResponse(context)
  } catch (error) {
    return createApplicationOrInternalErrorResponse(error)
  }
}
